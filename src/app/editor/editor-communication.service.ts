import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { GridsterItem } from 'angular-gridster2';

export interface EditorData {
  gridItems: (GridsterItem & { type: 'text' | 'image'; id: number; content?: string })[];
  imageUrls: { [id: number]: string };
  textStyles: { [id: number]: any };
  imageLinks: { [id: number]: string };
}

@Injectable({
  providedIn: 'root'
})
export class EditorCommunicationService {
  private readonly STORAGE_KEY = 'editor_saved_data';

  private restoreStateSource = new Subject<EditorData>();
  restoreState$ = this.restoreStateSource.asObservable();

  constructor() { }

  saveState(editorData: EditorData): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(editorData));
      alert('Editor content and images saved to local storage!');
    } catch (error) {
      console.error('Failed to save state to local storage:', error);
      alert('Failed to save state.');
    }
  }

  loadState(): EditorData | null {
    const savedData = localStorage.getItem(this.STORAGE_KEY);
    if (!savedData) {
      alert('No saved data found.');
      return null;
    }

    try {
      return JSON.parse(savedData) as EditorData;
    } catch (err) {
      console.error('Failed to parse saved editor data:', err);
      alert('Failed to restore the saved state.');
      return null;
    }
  }

  requestRestoreState(): void {
    const data = this.loadState();
    if (data) {
      this.restoreStateSource.next(data);
    }
  }
}