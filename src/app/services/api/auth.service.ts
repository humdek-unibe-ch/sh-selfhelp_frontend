import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({
   providedIn: 'root'
})
export class AuthService extends ApiService {

   constructor() {
      super()
   }

}
