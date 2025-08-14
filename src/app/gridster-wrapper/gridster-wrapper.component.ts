import {
  Component,
  Input,
  ElementRef,
  OnDestroy,
  Output,
  EventEmitter,
  OnInit,
} from '@angular/core';
import { GridsterConfig, GridsterItem } from 'angular-gridster2';
import { EditorStateService, StyleState } from '../editor/editor-state.service';
import { Subscription } from 'rxjs';

// A consolidated state structure for each grid item
interface GridItemState {
  style?: StyleState;
  elementRef?: ElementRef;
  imageLink?: string;
}

// Default state constant
const DEFAULT_STYLE_STATE: StyleState = {
  fontWeight: 'normal', fontStyle: 'normal', fontSize: 'medium', textAlign: 'left',
  verticalAlign: 'top', color: '#000000', backgroundColor: '#ffffff', borderColor: '#cccccc',
};

@Component({
  selector: 'app-gridster-wrapper',
  templateUrl: './gridster-wrapper.component.html',
  styleUrls: ['./gridster-wrapper.component.scss'],
})
export class GridsterWrapperComponent implements OnInit, OnDestroy {
  @Input() items: (GridsterItem & { type: 'text' | 'image'; id: number })[] = [];
  @Input() imageUrlMap: { [id: number]: string } = {};

  @Output() deleteItemRequested = new EventEmitter<number>();
  @Output() replaceImageRequested = new EventEmitter<number>();
  @Output() imageUrlMapChanged = new EventEmitter<{ [id: number]: string }>();

  // Single map holding all state for each item
  itemStateMap: { [id: number]: GridItemState } = {};

  options: GridsterConfig = {
    draggable: { enabled: true, ignoreContent: true },
    resizable: { enabled: true },
    pushItems: true,
    minCols: 6,
    minRows: 6,
  };

  focusedId: number | null = null;
  private maxZIndex = 1000;
  private stateSubscription!: Subscription;

  constructor(private editorStateService: EditorStateService) {}

  ngOnInit(): void {
    // Subscribe to state changes from the service
    this.stateSubscription = this.editorStateService.restoreState$.subscribe(state => {
      this.restoreAllStates(state.textStyles, state.imageLinks);
    });
  }

  ngOnDestroy(): void {
    this.stateSubscription?.unsubscribe();
  }

  // This can be called by a parent to get the current state for saving
  public getCurrentState(): { textStyles: { [id: number]: any }, imageLinks: { [id: number]: string } } {
    const textStyles: { [id: number]: any } = {};
    const imageLinks: { [id: number]: string } = {};

    for (const id in this.itemStateMap) {
      if (this.itemStateMap.hasOwnProperty(id)) {
        textStyles[id] = this.itemStateMap[id].style || {};
        if (this.itemStateMap[id].imageLink) {
          imageLinks[id] = this.itemStateMap[id].imageLink!;
        }
      }
    }
    return { textStyles, imageLinks };
  }

  // Simplified method to update any part of an item's state
  updateItemState(id: number, partialState: Partial<GridItemState>) {
    this.itemStateMap[id] = { ...(this.itemStateMap[id] || {}), ...partialState };
  }

  onFocusChange(id: number, isFocused: boolean) {
    this.focusedId = isFocused ? id : null;
    // Initialize with default styles on first focus
    if (isFocused && !this.itemStateMap[id]?.style) {
      this.updateItemState(id, { style: { ...DEFAULT_STYLE_STATE } });
    }
  }

  onStyleChanged(id: number, updatedStyle: any) {
    this.updateItemState(id, { style: { ...this.itemStateMap[id].style, ...updatedStyle } });
  }

  handleDelete(id: number) {
    delete this.itemStateMap[id];
    delete this.imageUrlMap[id];
    if (this.focusedId === id) {
      this.focusedId = null;
    }
    this.deleteItemRequested.emit(id);
  }

  getItemZIndex(itemId: number): number {
    return this.focusedId === itemId ? this.maxZIndex : 1;
  }

  private restoreAllStates(textStyles: { [id: number]: StyleState }, imageLinks: { [id: number]: string }) {
    this.itemStateMap = {}; // Reset state
    Object.keys(textStyles).forEach(idStr => {
      const id = parseInt(idStr, 10);
      this.updateItemState(id, { style: textStyles[id] });
    });
    Object.keys(imageLinks).forEach(idStr => {
      const id = parseInt(idStr, 10);
      this.updateItemState(id, { imageLink: imageLinks[id] });
    });
  }
}