import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  Renderer2,
  ViewChild
} from '@angular/core';
import { GridsterItem } from 'angular-gridster2';
import { contentType } from '../enums/enums';
import { EditorCommunicationService, EditorData } from './editor-communication.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('contextMenu') contextMenu!: ElementRef;
  @ViewChild('editorWrapper') editorWrapper!: ElementRef;
  @ViewChild('imageInput') imageInput!: ElementRef<HTMLInputElement>;

  viewMode: contentType | null = null;
  imageUrlMap: { [id: number]: string } = {};
  items: (GridsterItem & { type: 'text' | 'image'; id: number; content?: string })[] = [];
  
  private replacingImageId: number | null = null;
  private subscriptions = new Subscription();

  constructor(
    private renderer: Renderer2,
    private editorCommService: EditorCommunicationService
  ) {}

  ngAfterViewInit(): void {
    this.renderer.listen('document', 'contextmenu', (e: MouseEvent) => {
      e.preventDefault();
      const menu = this.contextMenu.nativeElement;
      menu.style.top = `${e.clientY}px`;
      menu.style.left = `${e.clientX}px`;
      menu.classList.remove('hidden');
    });

    this.renderer.listen('document', 'click', () => {
      this.contextMenu.nativeElement.classList.add('hidden');
    });

    this.subscriptions.add(
      this.editorCommService.restoreState$.subscribe(data => {
        this.restoreState(data);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private findNextAvailableX(): number {
    let maxX = 0;
    for (const item of this.items) {
      if (item.y === 1) {
        const rightEdge = item.x + item.cols;
        if (rightEdge > maxX) {
          maxX = rightEdge;
        }
      }
    }
    return maxX;
  }

  private addItem(type: contentType): void {
    this.viewMode = type; 
    this.editorWrapper.nativeElement.classList.remove('hidden');
    this.contextMenu.nativeElement.classList.add('hidden');
    
    if (type === contentType.Image && !this.replacingImageId) {
      // Clear the input value before triggering file selection
      this.clearFileInput();
      this.imageInput.nativeElement.click();
    } else {
      const newId = Date.now() + Math.floor(Math.random() * 1000);
      this.items.push({
        x: this.findNextAvailableX(),
        y: 1,
        cols: 1,
        rows: 1,
        type: type, 
        id: newId,
        content: type === contentType.Text ? '' : undefined
      });
    }
  }

  addText(): void {
    this.addItem(contentType.Text);
  }

  addImage(): void {
    console.log('Add image clicked'); // Debug log
    this.addItem(contentType.Image);
  }

  replaceImage(id: number): void {
    console.log('Replace image for ID:', id); // Debug log
    this.replacingImageId = id;
    // Clear the input value before triggering file selection
    this.clearFileInput();
    this.imageInput.nativeElement.click();
  }

  // Helper method to clear file input
  private clearFileInput(): void {
    if (this.imageInput?.nativeElement) {
      this.imageInput.nativeElement.value = '';
      console.log('File input cleared'); // Debug log
    }
  }
  
  onImageSelected(event: Event): void {
    console.log('Image selection event triggered'); // Debug log
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) {
      console.log('No file selected'); // Debug log
      return;
    }

    console.log('File selected:', file.name, 'Size:', file.size); // Debug log

    if (file.size > 5 * 1024 * 1024) {
      alert(`File size exceeds 5MB limit.`);
      this.clearFileInput();
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      console.log('File read successfully, data URL length:', dataUrl.length); // Debug log
      
      if (this.replacingImageId !== null) {
        console.log('Replacing image with ID:', this.replacingImageId); // Debug log
        this.imageUrlMap[this.replacingImageId] = dataUrl;
        this.replacingImageId = null;
      } else {
        const newId = Date.now() + Math.floor(Math.random() * 1000);
        console.log('Creating new image item with ID:', newId); // Debug log
        this.items.push({
          x: this.findNextAvailableX(), 
          y: 1, 
          cols: 1, 
          rows: 1, 
          type: 'image', 
          id: newId
        });
        this.imageUrlMap[newId] = dataUrl;
        console.log('Image added to items array. Total items:', this.items.length); // Debug log
      }
      
      // Clear the input after processing
      this.clearFileInput();
    };

    reader.onerror = (error) => {
      console.error('Error reading file:', error); // Debug log
      this.clearFileInput();
    };

    reader.readAsDataURL(file);
  }

  saveChanges(): void {
    const event = new CustomEvent('requestSaveData', {
      detail: (data: Partial<EditorData>) => {
        const editorData: EditorData = {
          gridItems: this.items,
          imageUrls: this.imageUrlMap,
          textStyles: data.textStyles || {},
          imageLinks: data.imageLinks || {}
        };
        this.editorCommService.saveState(editorData);
      }
    });
    document.dispatchEvent(event);
  }

  discardChanges(): void {
    if (confirm('Are you sure you want to discard unsaved changes?')) {
      this.editorCommService.requestRestoreState();
    }
  }
  
  private restoreState(data: EditorData): void {
    this.items = data.gridItems || [];
    this.imageUrlMap = data.imageUrls || {};

    setTimeout(() => {
      const restoreEvent = new CustomEvent('restoreInternalState', { detail: data });
      document.dispatchEvent(restoreEvent);
      this.editorWrapper.nativeElement.classList.add('hidden');
      alert('Editor has been restored to the last saved state.');
    }, 100);
  }

  deleteItem(id: number): void {
    const index = this.items.findIndex(item => item.id === id);
    if (index !== -1) {
      if (this.items[index].type === 'image') {
        delete this.imageUrlMap[id];
      }
      this.items.splice(index, 1);
    }
  }

  onImageUpdated(updatedMap: { [id: number]: string }): void {
    this.imageUrlMap = { ...updatedMap };
  }
}