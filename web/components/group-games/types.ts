export type Mode = 'animals' | 'heat';
export interface Vec { x:number; y:number; z:number }
export interface Sample extends Vec { t:number; energy?:number; note?:string }
export interface Traveler { id:number; label:string; origin:string; itinerary:string[]; samples:Sample[]; outcome:string; detail:string; energy?:number; completed:number; required:number; detached?:boolean }
export interface Simulation { travelers:Traveler[]; duration:number; success:number; total:number; counts:Record<string,number>; score:number }
export interface Shape { kind:'box'|'tree'|'tunnel'; x:number;y:number;z:number;w:number;h:number;d:number;color:number; pick?:string; opacity?:number }
export interface Marker extends Vec { text:string; color?:string }
export interface World { shapes:Shape[]; markers:Marker[] }
