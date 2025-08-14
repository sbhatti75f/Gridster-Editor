import {
  Component,
  AfterViewInit,
  ViewChild,
  ElementRef,
  Renderer2,
  Output,
  EventEmitter,
  Input,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy
} from '@angular/core';

@Component({
  selector: 'app-text-area',
  templateUrl: './text-area.component.html',
  styleUrls: ['./text-area.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextAreaComponent implements AfterViewInit, OnChanges {
  @ViewChild('editableDiv') editableDiv!: ElementRef;
  @Output() focusChanged = new EventEmitter<boolean>(); 
  @Output() editableRef = new EventEmitter<ElementRef>();
  @Input() styleState: any = {}; 

  private removeListeners: (() => void)[] = [];

  constructor(private renderer: Renderer2) {}

  ngAfterViewInit(): void {
    this.editableDiv.nativeElement.innerHTML = this.styleState.content || '';
    this.applyStyles();
    this.editableRef.emit(this.editableDiv);

    // Add multiple event listeners to ensure focus is captured
    this.removeListeners.push(
      this.renderer.listen(this.editableDiv.nativeElement, 'focus', (event) => {
        console.log('Text area focused'); // Debug log
        this.focusChanged.emit(true);
      })
    );

    this.removeListeners.push(
      this.renderer.listen(this.editableDiv.nativeElement, 'blur', (event) => {
        console.log('Text area blurred'); // Debug log
        this.focusChanged.emit(false);
      })
    );

    // Additional click listener to ensure focus is triggered
    this.removeListeners.push(
      this.renderer.listen(this.editableDiv.nativeElement, 'click', (event) => {
        console.log('Text area clicked'); // Debug log
        this.editableDiv.nativeElement.focus();
        this.focusChanged.emit(true);
      })
    );

    // Mousedown listener to capture early interaction
    this.removeListeners.push(
      this.renderer.listen(this.editableDiv.nativeElement, 'mousedown', (event) => {
        console.log('Text area mousedown'); // Debug log
        // Small delay to ensure focus happens after mousedown
        setTimeout(() => {
          this.editableDiv.nativeElement.focus();
          this.focusChanged.emit(true);
        }, 10);
      })
    );
  }

  ngOnDestroy(): void {
    // Clean up event listeners
    this.removeListeners.forEach(remove => remove());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['styleState'] && this.editableDiv) {
      this.applyStyles();
    }
  }

  private applyStyles(): void {
    const el = this.editableDiv?.nativeElement;
    if (!el || !this.styleState) return;

    const wrapper = el.parentElement;
    if(wrapper) {
        this.renderer.setStyle(wrapper, 'justify-content', this.convertVerticalAlignToFlex(this.styleState.verticalAlign));
    }
    
    this.renderer.setStyle(el, 'font-weight', this.styleState.fontWeight || 'normal');
    this.renderer.setStyle(el, 'font-style', this.styleState.fontStyle || 'normal');
    this.renderer.setStyle(el, 'font-size', this.convertSizeToPx(this.styleState.fontSize));
    this.renderer.setStyle(el, 'text-align', this.styleState.textAlign || 'left');
    this.renderer.setStyle(el, 'color', this.styleState.color || '#000000');
    
    const container = wrapper?.parentElement;
    if(container) {
        this.renderer.setStyle(container, 'background-color', this.styleState.backgroundColor || 'transparent');
        this.renderer.setStyle(container, 'border-color', this.styleState.borderColor || '#cccccc');
        this.renderer.setStyle(container, 'border-style', this.styleState.borderColor ? 'solid' : 'none');
        this.renderer.setStyle(container, 'border-width', this.styleState.borderColor ? '1px' : '0');
    }
  }
  
  private convertSizeToPx(size: string): string {
    const map: { [key: string]: string } = { small: '12px', medium: '16px', large: '24px', xlarge: '32px' };
    return map[size] || '16px';
  }

  private convertVerticalAlignToFlex(align: string): string {
    const map: { [key: string]: string } = { top: 'flex-start', middle: 'center', bottom: 'flex-end' };
    return map[align] || 'flex-start';
  }

  // Add these methods to handle template events
  onFocus(event: Event): void {
    console.log('Template focus event triggered'); // Debug log
    this.focusChanged.emit(true);
  }

  onBlur(event: Event): void {
    console.log('Template blur event triggered'); // Debug log
    this.focusChanged.emit(false);
  }

  onClick(event: Event): void {
    console.log('Template click event triggered'); // Debug log
    this.focusChanged.emit(true);
  }
}