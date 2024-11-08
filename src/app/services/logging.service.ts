import { Injectable } from '@angular/core';

@Injectable({
   providedIn: 'root'
})
export class LoggingService {
   private debugEnabled: boolean = true;

   constructor() { }

   // Enable or disable debug mode
   public setDebug(enable: boolean): void {
      this.debugEnabled = enable;
   }

   // Log a debug message if debug mode is enabled
   public debugLog(...optionalParams: any[]): void {
      if (this.debugEnabled) {
         const currentTime = new Date().toLocaleString();
         console.log(`[${currentTime}] DEBUG`, ...optionalParams);
      }
   }
}
