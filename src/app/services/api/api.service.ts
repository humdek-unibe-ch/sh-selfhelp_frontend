import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { NavItem } from 'src/app/layouts/full/vertical/sidebar/nav-item/nav-item';
import { NavigationACL } from 'src/app/models/selfhelp.model';

@Injectable({
   providedIn: 'root'
})
export class ApiService {
   private apiUrl = '/selfhelp/cms-api'; // API endpoint for routes

   constructor(private http: HttpClient) { }

   /**
   * Method to handle both GET and POST requests with credentials (cookies-based authentication)
   * @param method - HTTP method ('GET' or 'POST')
   * @param url - API endpoint URL
   * @param params - Optional parameters for the request
   * @param headers - Optional custom headers
   */
   private makeRequest(method: 'GET' | 'POST', requestUrl: string, params?: any, headers?: HttpHeaders): Observable<any> {
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

   public getNavigation(): Observable<NavItem[]> {
      return this.makeRequest('GET', '/nav/pages/web', { mobile: true, web: true }).pipe(
         map((response: NavigationACL[]) =>
            response.map(nav => ({
               displayName: nav.keyword,
               route: nav.url,
            }))
         )
      );
   }

}
