import {
  AfterViewInit,
  Component,
  ElementRef,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { GridsterItem } from 'angular-gridster2';
import { contentType } from '../enums/enums';
import { EditorStateService } from './editor-state.service';
import { GridsterWrapperComponent } from '../gridster-wrapper/gridster-wrapper.component';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements AfterViewInit {
  @ViewChild('contextMenu') contextMenu!: ElementRef;
  @ViewChild('editorWrapper') editorWrapper!: ElementRef;
  @ViewChild('imageInput') imageInput!: ElementRef<HTMLInputElement>;
  @ViewChild(GridsterWrapperComponent) gridsterWrapper!: GridsterWrapperComponent;

  viewMode: contentType | null = null;
  imageUrlMap: { [id: number]: string } = {};
  items: (GridsterItem & { type: 'text' | 'image'; id: number; content?: string })[] = [];
  
  private replacingImageId: number | null = null;
  private readonly STORAGE_KEY = 'editor_saved_data';

  constructor(private renderer: Renderer2, private editorStateService: EditorStateService) {}

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
  }
  
  addText(): void {
    this.viewMode = contentType.Text;
    this.editorWrapper.nativeElement.classList.remove('hidden');
    this.contextMenu.nativeElement.classList.add('hidden');
    const newId = Date.now() + Math.floor(Math.random() * 1000);

    let maxX = 0;
    for (const item of this.items) {
      if (item.y === 1) {  // check row 1 now
        const rightEdge = item.x + item.cols;
        if (rightEdge > maxX) {
          maxX = rightEdge;
        }
      }
    }

    this.items.push({
      x: maxX,
      y: 1,
      cols: 1,
      rows: 1,
      type: 'text',
      id: newId,
      content: '' // Initialize with empty content
    });
  }

  addImage(): void {
    this.viewMode = contentType.Image;
    this.editorWrapper.nativeElement.classList.remove('hidden');
    this.contextMenu.nativeElement.classList.add('hidden');

    this.imageInput.nativeElement.click(); 
  }
  
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Check file size (limit: 5MB)
    const maxSizeMB = 5;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      alert(`File size exceeds ${maxSizeMB}MB limit. Please choose a smaller image.`);
      this.imageInput.nativeElement.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      
      if (this.replacingImageId !== null) {
        // Replace existing image
        this.imageUrlMap[this.replacingImageId] = dataUrl;
        this.replacingImageId = null; // Reset
      } else {
        // Add new image (existing logic)
        const newId = Date.now() + Math.floor(Math.random() * 1000);

        let maxX = 0;
        for (const item of this.items) {
          if (item.y === 1) {  
            const rightEdge = item.x + item.cols;
            if (rightEdge > maxX) {
              maxX = rightEdge;
            }
          }
        }

        this.items.push({
          x: maxX,
          y: 1,
          cols: 1,
          rows: 1,
          type: 'image',
          id: newId
        });
        this.imageUrlMap[newId] = dataUrl;
      }

      // Clear input
      this.imageInput.nativeElement.value = '';
    };

    reader.readAsDataURL(file);
  }

  saveChanges(): void {
    // Get the current state directly from the GridsterWrapper component
    const { textStyles, imageLinks } = this.gridsterWrapper.getCurrentState();

    const editorData = {
      gridItems: this.items,
      imageUrls: this.imageUrlMap,
      textStyles: textStyles,
      imageLinks: imageLinks
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(editorData));
    alert('Editor content and images saved!');
  }

  discardChanges(): void {
    const savedData = localStorage.getItem(this.STORAGE_KEY);
    if (!savedData) {
      alert('No saved data found.');
      return;
    }
    if (!confirm('Are you sure you want to revert to the last saved version?')) return;

    try {
      const parsedData = JSON.parse(savedData);
      this.items = parsedData.gridItems || [];
      this.imageUrlMap = parsedData.imageUrls || {};

      // Use the service to broadcast the state to restore
      this.editorStateService.restoreState(parsedData.textStyles || {}, parsedData.imageLinks || {});

      this.editorWrapper.nativeElement.classList.add('hidden');
      alert('Editor has been restored.');

    } catch (err) {
      console.error('Failed to parse saved data:', err);
      alert('Failed to restore the saved state.');
    }
  }

  deleteItem(id: number): void {
    // Find the index of the item to delete
    const index = this.items.findIndex(item => item.id === id);
    
    if (index !== -1) {
      // If it's an image item, remove from imageUrlMap
      if (this.items[index].type === 'image') {
        const { [id]: _, ...updatedImageUrls } = this.imageUrlMap;
        this.imageUrlMap = updatedImageUrls;
      }
      
      // Remove item using immutable operation
      this.items = this.items.filter(item => item.id !== id);
    }
  }

  onImageUpdated(updatedMap: { [id: number]: string }): void {
    this.imageUrlMap = { ...updatedMap };
  }

  replaceImage(id: number): void {
    this.replacingImageId = id;
    this.imageInput.nativeElement.click();
  }
}