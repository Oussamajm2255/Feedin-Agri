import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Angular service for submitting public lead forms (Contact + Training Request).
 * Calls the public /api/leads/* endpoints — no JWT required.
 */
@Injectable({ providedIn: 'root' })
export class LeadsService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = environment.apiUrl;

  /**
   * Submit a contact form request.
   * POST /api/leads/contact
   */
  submitContact(dto: ContactRequestDto): Observable<LeadResponse> {
    return this.http.post<LeadResponse>(`${this.API_URL}/leads/contact`, dto, {
      withCredentials: true,
    });
  }

  /**
   * Submit a training request from the Formation page drawer.
   * POST /api/leads/training-request
   */
  submitTrainingRequest(dto: TrainingRequestDto): Observable<LeadResponse> {
    return this.http.post<LeadResponse>(`${this.API_URL}/leads/training-request`, dto, {
      withCredentials: true,
    });
  }
}

/** DTO interfaces matching the backend DTOs */
export interface ContactRequestDto {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  project_type: string;
  message: string;
}

export interface TrainingRequestDto {
  full_name: string;
  email: string;
  phone?: string;
  training_type: 'level_1' | 'level_2' | 'level_3';
  farm_size?: string;
  region?: string;
  message?: string;
}

export interface LeadResponse {
  success: boolean;
  message: string;
  id: string;
}
