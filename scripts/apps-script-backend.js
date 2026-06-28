/**
 * Google Apps Script — SVG 審核後端
 *
 * 部署步驟：
 * 1. 到 https://script.google.com 建立新專案
 * 2. 貼上此程式碼
 * 3. 執行 setup() 建立試算表（授權後看 Logger 取得 Sheet URL）
 * 4. 部署 > 新增部署 > 類型選「網頁應用程式」
 *    - 執行身份：我
 *    - 存取權限：任何人
 * 5. 複製部署 URL，貼到 svg-review.html 的 APPS_SCRIPT_URL 變數
 */

// ── 設定 ──
const SHEET_NAME = "SVG審核回覆";
const IMAGES_FOLDER_NAME = "CCE-SVG-Uploads";

function setup() {
  // 建立試算表
  const ss = SpreadsheetApp.create("CCE SVG 審核回覆");
  const sheet = ss.getActiveSheet();
  sheet.setName(SHEET_NAME);
  sheet.appendRow([
    "時間戳記", "姓名", "Email", "Package", "Slide ID",
    "行號", "類型", "Prompt / URL", "上傳圖片連結"
  ]);
  sheet.setFrozenRows(1);

  // 建立圖片資料夾
  DriveApp.createFolder(IMAGES_FOLDER_NAME);

  Logger.log("試算表：" + ss.getUrl());
  Logger.log("設定完成！接下來部署為網頁應用程式。");
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet() || findSheet();
    const sheet = ss.getSheetByName(SHEET_NAME);

    const teacher = data.teacher || "匿名";
    const email = data.email || "";
    const timestamp = new Date().toLocaleString("zh-TW");

    for (const entry of data.entries) {
      let imageUrl = "";

      // 如果有上傳圖片（base64），存到 Drive
      if (entry.type === "upload" && entry.imageData) {
        const blob = Utilities.newBlob(
          Utilities.base64Decode(entry.imageData.split(",")[1]),
          entry.imageMime || "image/png",
          entry.imageFilename || "upload.png"
        );
        const folders = DriveApp.getFoldersByName(IMAGES_FOLDER_NAME);
        const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(IMAGES_FOLDER_NAME);
        const file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        imageUrl = file.getUrl();
      }

      sheet.appendRow([
        timestamp,
        teacher,
        email,
        entry.pkg,
        entry.slide,
        entry.line,
        entry.type,       // "prompt" | "url" | "upload"
        entry.value || "", // prompt 文字或圖片 URL
        imageUrl           // Drive 連結（僅上傳時）
      ]);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, count: data.entries.length }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet() || findSheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    const rows = sheet.getDataRange().getValues();
    // rows[0] = header, skip it
    const entries = [];
    for (let i = 1; i < rows.length; i++) {
      const [timestamp, name, email, pkg, slide, line, type, value, uploadUrl] = rows[i];
      entries.push({ timestamp, name, email, pkg, slide, line: String(line), type, value, uploadUrl });
    }
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, entries }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function findSheet() {
  const files = DriveApp.getFilesByName("CCE SVG 審核回覆");
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  }
  throw new Error("找不到試算表，請先執行 setup()");
}
