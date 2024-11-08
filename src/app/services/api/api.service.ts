import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LoggingService } from '../logging.service';

@Injectable({
   providedIn: 'root'
})
export class ApiService {
   private apiUrl = '/selfhelp/cms-api'; // API endpoint for routes

   protected http: HttpClient = inject(HttpClient);
   protected logService: LoggingService = inject(LoggingService);

   constructor() { }

   /**
   * Method to handle both GET and POST requests with credentials (cookies-based authentication)
   * @param method - HTTP method ('GET' or 'POST')
   * @param url - API endpoint URL
   * @param params - Optional parameters for the request
   * @param headers - Optional custom headers
   */
   protected makeRequest(method: 'GET' | 'POST', requestUrl: string, params?: any, headers?: HttpHeaders): Observable<any> {
      // Default headers for the request (can be customized)
      let url = this.apiUrl + requestUrl;
      const defaultHeaders = headers ? headers : new HttpHeaders({
         'Content-Type': 'application/json'
      });

      // Common options for both GET and POST requests
      const options = {
         headers: defaultHeaders,
         withCredentials: true // This ensures that cookies are included for authentication
      };

      // Handle GET request
      if (method === 'GET') {
         const getOptions = {
            ...options,
            params: new HttpParams({ fromObject: params })
         };
         return this.http.get(url, getOptions);
      }
      // Handle POST request
      else if (method === 'POST') {
         // Depending on the expected content type, send params accordingly
         if (defaultHeaders.get('Content-Type') === 'application/x-www-form-urlencoded') {
            const body = new HttpParams({ fromObject: params });
            return this.http.post(url, body.toString(), options);
         } else {
            return this.http.post(url, params, options);
         }
      }

      throw new Error('Unsupported request method');
   }

}
