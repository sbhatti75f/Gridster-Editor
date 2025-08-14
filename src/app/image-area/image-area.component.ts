import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';

@Component({
  selector: 'app-image-area',
  templateUrl: './image-area.component.html',
  styleUrls: ['./image-area.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImageAreaComponent implements AfterViewInit, OnChanges {
  @Input() imageUrl: string = '';
  @Input() imageLink: string = '';
  @Input() imageId!: number;

  @Output() focusChanged = new EventEmitter<boolean>();
  @Output() imageElementRefOutput = new EventEmitter<{ id: number, elementRef: ElementRef }>();

  @ViewChild('imageRef', { static: false }) imageRef!: ElementRef<HTMLImageElement>;

  fallbackImg = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
  showTooltip = false;
  tooltipPosition = { x: 0, y: 0 };

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['imageUrl'] || changes['imageLink']) {
      this.cdr.markForCheck();
    }
  }

  ngAfterViewInit(): void {
    if (this.imageRef) {
      this.imageElementRefOutput.emit({
        id: this.imageId,
        elementRef: this.imageRef
      });
    }
  }

  onFocus(): void {
    this.focusChanged.emit(true);
  }

  onBlur(): void {
    this.focusChanged.emit(false);
  }

  onImageHover(event: MouseEvent): void {
    if (!this.imageLink) return;

    this.showTooltip = true;
    const containerRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.tooltipPosition = {
      x: event.clientX - containerRect.left,
      y: event.clientY - containerRect.top
    };
  }

  onImageLeave(): void {
    this.showTooltip = false;
  }

  getLinkDisplayName(): string {
    if (!this.imageLink) return '';
    try {
      const url = new URL(this.imageLink);
      return url.hostname;
    } catch {
      return this.imageLink;
    }
  }
}