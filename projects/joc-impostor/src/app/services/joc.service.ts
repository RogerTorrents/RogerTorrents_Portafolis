import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class JocService {
  private apiUrl = 'http://localhost:3000/api'; // La URL del teu backend

  constructor(private http: HttpClient) { }

  obtenirParaulesDeIA(categoria: string, excloses: string[] = []): Observable<{ paraules: string[] }> {
    return this.http.post<{ paraules: string[] }>(`${this.apiUrl}/paraules`, {
      categoria,
      paraulesExcloses: excloses
    });
  }
}