import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

// Interface for a cleaner style state object
export interface StyleState {
  fontWeight?: string;
  fontStyle?: string;
  fontSize?: string;
  textAlign?: string;
  verticalAlign?: string;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
}

@Injectable({
  providedIn: 'root',
})
export class EditorStateService {
  // Use Subjects to broadcast events instead of document.dispatchEvent
  private restoreStateSource = new Subject<{ textStyles: { [id: number]: StyleState }, imageLinks: { [id: number]: string } }>();
  private requestStateSource = new Subject<void>();

  // Public observables that components can subscribe to
  restoreState$ = this.restoreStateSource.asObservable();
  requestState$ = this.requestStateSource.asObservable();

  /**
   * Call this to broadcast the state that needs to be restored.
   */
  restoreState(textStyles: { [id: number]: StyleState }, imageLinks: { [id: number]: string }) {
    this.restoreStateSource.next({ textStyles, imageLinks });
  }

  /**
   * Call this to request the current state from the gridster component.
   */
  requestCurrentState() {
    this.requestStateSource.next();
  }
}