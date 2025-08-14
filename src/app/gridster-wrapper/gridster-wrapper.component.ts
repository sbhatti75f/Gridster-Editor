import {
  Component,
  Input,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { GridsterConfig, GridsterItem } from 'angular-gridster2';
import { EditorData } from '../editor/editor-communication.service';

@Component({
  selector: 'app-gridster-wrapper',
  templateUrl: './gridster-wrapper.component.html',
  styleUrls: ['./gridster-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GridsterWrapperComponent implements AfterViewInit, OnDestroy {
  @Input() items: (GridsterItem & { type: 'text' | 'image'; id: number })[] = [];
  @Input() imageUrlMap: { [id: number]: string } = {};
  @Output() deleteItemRequested = new EventEmitter<number>();
  @Output() replaceImageRequested = new EventEmitter<number>();
  @Output() imageUrlMapChanged = new EventEmitter<{ [id: number]: string }>();

  imageLinkMap: { [id: number]: string } = {};
  imageElementRefMap: { [id: number]: ElementRef } = {};
  editableDivMap: { [id: number]: ElementRef } = {};
  styleStateMap: { [id: number]: any } = {};
  focusedId: number | null = null;
  maxZIndex = 1000;

  options: GridsterConfig = {
    draggable: { enabled: true, ignoreContent: true },
    resizable: { enabled: true },
    pushItems: true,
    minCols: 6,
    minRows: 6,
  };

  private eventListeners: { type: string, handler: (event: any) => void }[] = [];

  constructor(private hostRef: ElementRef, private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    this.addDocumentListener('click', (event: MouseEvent) => {
      if (!this.hostRef.nativeElement.contains(event.target)) {
        this.focusedId = null;
        this.cdr.markForCheck();
      }
    });

    this.addDocumentListener('requestSaveData', (event: CustomEvent) => {
      const callback = event.detail;
      if (typeof callback === 'function') {
        Object.keys(this.styleStateMap).forEach(idStr => {
            const id = parseInt(idStr, 10);
            const editableDiv = this.editableDivMap[id]?.nativeElement;
            if(editableDiv) {
                this.styleStateMap[id].content = editableDiv.innerHTML;
            }
        });

        callback({
          textStyles: this.styleStateMap,
          imageLinks: this.imageLinkMap,
        });
      }
    });
    
    this.addDocumentListener('restoreInternalState', (event: CustomEvent<EditorData>) => {
      const data = event.detail;
      this.styleStateMap = data.textStyles || {};
      this.imageLinkMap = data.imageLinks || {};
      setTimeout(() => {
          Object.keys(this.styleStateMap).forEach(idStr => {
              const id = parseInt(idStr, 10);
              const editableDiv = this.editableDivMap[id]?.nativeElement;
              if(editableDiv) {
                  editableDiv.innerHTML = this.styleStateMap[id].content || '';
              }
          });
          this.cdr.detectChanges();
      });
    });
  }

  private addDocumentListener(type: string, handler: (event: any) => void): void {
    document.addEventListener(type, handler);
    this.eventListeners.push({ type, handler });
  }
  
  ngOnDestroy(): void {
    this.eventListeners.forEach(listener => {
      document.removeEventListener(listener.type, listener.handler);
    });
  }

  getItemZIndex(itemId: number): number {
    return this.focusedId === itemId ? this.maxZIndex : 1;
  }

  // FIX: Added this.cdr.markForCheck() to trigger change detection
  onFocusChange(id: number, isFocused: boolean): void {
    this.focusedId = isFocused ? id : null;
    if (isFocused && !this.styleStateMap[id]) {
      this.styleStateMap[id] = this.getDefaultStyleState();
    }
    this.cdr.markForCheck(); // This tells Angular to update the view
  }

  onStyleChanged(id: number, updatedStyle: any): void {
    this.styleStateMap[id] = { ...this.styleStateMap[id], ...updatedStyle };
  }

  setEditableDiv(id: number, ref: ElementRef): void {
    this.editableDivMap[id] = ref;
  }

  setImageElementRef(id: number, ref: ElementRef): void {
    this.imageElementRefMap[id] = ref;
  }

  setImageLink(id: number, link: string): void {
    this.imageLinkMap[id] = link;
    this.cdr.markForCheck();
  }

  requestImageReplace(id: number): void {
    this.replaceImageRequested.emit(id);
  }
  
  handleDelete(id: number): void {
    delete this.styleStateMap[id];
    delete this.editableDivMap[id];
    delete this.imageUrlMap[id];
    delete this.imageElementRefMap[id];
    delete this.imageLinkMap[id];
    if (this.focusedId === id) {
      this.focusedId = null;
    }
    this.deleteItemRequested.emit(id);
  }

  private getDefaultStyleState(): any {
    return {
      fontWeight: 'normal',
      fontStyle: 'normal',
      fontSize: 'medium',
      textAlign: 'left',
      verticalAlign: 'top',
      color: '#000000',
      backgroundColor: '#ffffff',
      borderColor: '#cccccc',
      content: ''
    };
  }
}