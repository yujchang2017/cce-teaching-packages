#!/usr/bin/env node
/**
 * 讀取 image-prompts.json，批次呼叫 ComfyUI API 產生投影片插圖。
 *
 * 用法：
 *   node scripts/gen-images.cjs packages/level-iii/1.1-III
 *   node scripts/gen-images.cjs packages/level-iii/1.1-III --dry-run
 *   node scripts/gen-images.cjs packages/level-iii/1.1-III --host http://192.168.1.100:8188
 *
 * 需要：該資料夾內有 image-prompts.json
 * 產出：images/slide-01.png, slide-02.png, ...
 */
const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");

// ── CLI ──
const args = process.argv.slice(2);
const pkgDir = args.find(a => !a.startsWith("-"));
if (!pkgDir) {
  console.error("用法: node scripts/gen-images.cjs <package-dir> [--dry-run] [--host URL]");
  process.exit(1);
}
const dryRun = args.includes("--dry-run");
const hostIdx = args.indexOf("--host");
const COMFY_HOST = (hostIdx !== -1 && args[hostIdx + 1]) || "http://127.0.0.1:8188";

// ── ComfyUI workflow template (z_image_turbo) ──
const WORKFLOW_TEMPLATE = {
  "9": {
    inputs: { filename_prefix: "slide", images: ["57:8", 0] },
    class_type: "SaveImage", _meta: { title: "Save" }
  },
  "57:30": {
    inputs: { clip_name: "qwen_3_4b.safetensors", type: "lumina2", device: "default" },
    class_type: "CLIPLoader", _meta: { title: "CLIPLoader" }
  },
  "57:29": {
    inputs: { vae_name: "ae.safetensors" },
    class_type: "VAELoader", _meta: { title: "VAELoader" }
  },
  "57:33": {
    inputs: { conditioning: ["57:27", 0] },
    class_type: "ConditioningZeroOut", _meta: { title: "NegativeZeroOut" }
  },
  "57:8": {
    inputs: { samples: ["57:3", 0], vae: ["57:29", 0] },
    class_type: "VAEDecode", _meta: { title: "VAEDecode" }
  },
  "57:28": {
    inputs: { unet_name: "z_image_turbo_bf16.safetensors", weight_dtype: "default" },
    class_type: "UNETLoader", _meta: { title: "UNETLoader" }
  },
  "57:27": {
    inputs: { text: "", clip: ["57:30", 0] },
    class_type: "CLIPTextEncode", _meta: { title: "Positive" }
  },
  "57:13": {
    inputs: { width: 640, height: 640, batch_size: 1 },
    class_type: "EmptySD3LatentImage", _meta: { title: "EmptyLatent" }
  },
  "57:11": {
    inputs: { shift: 3, model: ["57:28", 0] },
    class_type: "ModelSamplingAuraFlow", _meta: { title: "AuraFlow" }
  },
  "57:3": {
    inputs: { seed: 0, steps: 8, cfg: 1, sampler_name: "res_multistep", scheduler: "simple", denoise: 1,
      model: ["57:11", 0], positive: ["57:27", 0], negative: ["57:33", 0], latent_image: ["57:13", 0] },
    class_type: "KSampler", _meta: { title: "KSampler" }
  }
};

// ── Load prompt file ──
function loadPrompts(dir) {
  const promptFile = path.join(dir, "image-prompts.json");
  if (!fs.existsSync(promptFile)) {
    console.error("❌ 找不到 image-prompts.json，請先建立：" + promptFile);
    console.error("   格式見 packages/level-iii/1.1-III/image-prompts.json");
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(promptFile, "utf8"));
}

// ── ComfyUI API call ──
function postPrompt(workflow) {
  return new Promise((resolve, reject) => {
    const url = new URL(COMFY_HOST + "/prompt");
    const payload = JSON.stringify({ prompt: workflow });
    const options = {
      hostname: url.hostname, port: url.port, path: url.pathname,
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) },
    };
    const client = url.protocol === "https:" ? https : http;
    const req = client.request(options, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        if (res.statusCode >= 400) reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        else resolve(JSON.parse(data));
      });
    });
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

// Wait for image to be generated (poll history)
function waitForImage(promptId, timeoutMs = 600000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const poll = () => {
      if (Date.now() - start > timeoutMs) return reject(new Error("Timeout waiting for image"));
      const url = new URL(COMFY_HOST + "/history/" + promptId);
      const client = url.protocol === "https:" ? https : http;
      client.get(url, (res) => {
        let data = "";
        res.on("data", c => data += c);
        res.on("end", () => {
          const hist = JSON.parse(data);
          if (hist[promptId] && hist[promptId].outputs) {
            const saveNode = hist[promptId].outputs["9"];
            if (saveNode && saveNode.images && saveNode.images.length > 0) {
              resolve(saveNode.images[0]);
              return;
            }
          }
          setTimeout(poll, 2000);
        });
      }).on("error", () => setTimeout(poll, 3000));
    };
    poll();
  });
}

// Download image from ComfyUI
function downloadImage(imageInfo, destPath) {
  return new Promise((resolve, reject) => {
    const url = new URL(COMFY_HOST + "/view?" +
      `filename=${encodeURIComponent(imageInfo.filename)}` +
      `&subfolder=${encodeURIComponent(imageInfo.subfolder || "")}` +
      `&type=${imageInfo.type || "output"}`);
    const client = url.protocol === "https:" ? https : http;
    client.get(url, (res) => {
      const stream = fs.createWriteStream(destPath);
      res.pipe(stream);
      stream.on("finish", () => { stream.close(); resolve(); });
    }).on("error", reject);
  });
}

// ── Main ──
async function main() {
  const absDir = path.resolve(pkgDir);
  const imgDir = path.join(absDir, "images");
  const data = loadPrompts(absDir);
  const style = data._style || "";
  const negative = data._negative || "text, watermark, logo, blurry, low quality";
  const slideEntries = Object.entries(data.slides || {});

  console.log(`載入 ${slideEntries.length} 筆 prompt\n`);

  // Build task list
  const tasks = [];
  for (const [key, entry] of slideEntries) {
    const filename = `slide-${key}.png`;
    const destPath = path.join(imgDir, filename);

    if (fs.existsSync(destPath)) {
      console.log(`  ✅ ${filename} — ${entry.desc}（已存在，跳過）`);
      continue;
    }

    const fullPrompt = style ? (style + ", " + entry.prompt) : entry.prompt;
    tasks.push({ key, desc: entry.desc, filename, destPath, prompt: fullPrompt, negative });
    console.log(`  🎨 ${filename} — ${entry.desc}`);
  }

  console.log(`\n需要生成：${tasks.length} 張圖片`);

  if (dryRun) {
    console.log("\n--dry-run 模式，不呼叫 ComfyUI API\n");
    tasks.forEach(t => {
      console.log(`--- ${t.filename} ---`);
      console.log(`  ${t.prompt}\n`);
    });
    return;
  }

  if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });

  console.log(`\n連線 ComfyUI: ${COMFY_HOST}`);

  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i];
    console.log(`\n[${i + 1}/${tasks.length}] 生成 ${t.filename}（${t.desc}）...`);

    const wf = JSON.parse(JSON.stringify(WORKFLOW_TEMPLATE));
    wf["57:3"].inputs.seed = Math.floor(Math.random() * 1e15);
    wf["57:27"].inputs.text = t.prompt;
    wf["9"].inputs.filename_prefix = path.basename(t.filename, ".png");

    try {
      const result = await postPrompt(wf);
      const promptId = result.prompt_id;
      console.log(`  prompt_id: ${promptId}`);

      const imageInfo = await waitForImage(promptId);
      console.log(`  ComfyUI 輸出: ${imageInfo.filename}`);

      await downloadImage(imageInfo, t.destPath);
      console.log(`  ✅ 儲存: ${t.destPath}`);
    } catch (err) {
      console.error(`  ❌ 失敗: ${err.message}`);
      // Timeout — interrupt current job and clear queue to avoid blocking
      try {
        await new Promise((resolve, reject) => {
          const url = new URL(COMFY_HOST + "/interrupt");
          const req = (url.protocol === "https:" ? https : http).request(url, { method: "POST" }, res => { res.resume(); res.on("end", resolve); });
          req.on("error", reject); req.end();
        });
        await new Promise((resolve, reject) => {
          const url = new URL(COMFY_HOST + "/queue");
          const payload = JSON.stringify({ clear: true });
          const req = (url.protocol === "https:" ? https : http).request(url, { method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } }, res => { res.resume(); res.on("end", resolve); });
          req.on("error", reject); req.write(payload); req.end();
        });
        console.log("  🔄 已中斷，繼續下一張");
      } catch (e) { /* ignore cleanup errors */ }
    }
  }

  console.log(`\n完成！圖片在 ${imgDir}`);
  console.log("接下來執行：node scripts/md2pptx.cjs " + path.join(pkgDir, "ppt_script.md") + " --no-notes");
}

main().catch(err => { console.error(err); process.exit(1); });
