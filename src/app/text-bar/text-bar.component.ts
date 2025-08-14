import {
  Component,
  ViewChild,
  ElementRef,
  Renderer2,
  AfterViewInit,
  Input,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
  OnDestroy,
  ChangeDetectionStrategy
} from '@angular/core';

@Component({
  selector: 'app-text-bar',
  templateUrl: './text-bar.component.html',
  styleUrls: ['./text-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextBarComponent implements OnChanges, AfterViewInit, OnDestroy {
  @ViewChild('textColorIcon') textColorIcon!: ElementRef<SVGSVGElement>;
  @ViewChild('textSizeControl') textSizeControl!: ElementRef;
  @ViewChild('alignmentControl') alignmentControl!: ElementRef;
  @ViewChild('vAlignControl') vAlignControl!: ElementRef;

  @Input() editableDiv!: ElementRef;
  @Input() styleState: any;
  @Output() styleChanged = new EventEmitter<any>();
  @Output() deleteClicked = new EventEmitter<void>();

  isBoldActive = false;
  isItalicActive = false;
  selectedColor = '#000000';
  selectedBackgroundColor = '#ffffff';
  selectedBorderColor = '#cccccc';
  selectedTextAlign = 'left';
  selectedVerticalAlign = 'top';
  selectedFontSize = 'medium';

  showTextColorInput = false;
  showBackColorInput = false;
  showBorderColorInput = false;
  isTextSizeDropdownOpen = false;
  isAlignmentDropdownOpen = false;
  isVerticalAlignmentDropdownOpen = false;

  private savedSelection: Range | null = null;
  private listeners: Array<() => void> = [];
  
  private fontSizeMap: { [key: string]: string } = {
    small: '12px',
    medium: '16px',
    large: '24px',
    xlarge: '32px'
  };

  constructor(private renderer: Renderer2) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['styleState'] && this.styleState) {
      this.isBoldActive = this.styleState.fontWeight === 'bold';
      this.isItalicActive = this.styleState.fontStyle === 'italic';
      this.selectedFontSize = this.styleState.fontSize || 'medium';
      this.selectedColor = this.styleState.color || '#000000';
      this.selectedBackgroundColor = this.styleState.backgroundColor || '#ffffff';
      this.selectedBorderColor = this.styleState.borderColor || '#cccccc';
      this.selectedTextAlign = this.styleState.textAlign || 'left';
      this.selectedVerticalAlign = this.styleState.verticalAlign || 'top';
    }
  }

  ngAfterViewInit(): void {
    const doc = this.editableDiv.nativeElement.ownerDocument;
    this.listeners.push(
      doc.defaultView.document.addEventListener('click', (event: MouseEvent) => {
        const clickedEl = event.target as HTMLElement;
        if (this.textSizeControl && !this.textSizeControl.nativeElement.contains(clickedEl)) this.isTextSizeDropdownOpen = false;
        if (this.alignmentControl && !this.alignmentControl.nativeElement.contains(clickedEl)) this.isAlignmentDropdownOpen = false;
        if (this.vAlignControl && !this.vAlignControl.nativeElement.contains(clickedEl)) this.isVerticalAlignmentDropdownOpen = false;
        
        const isColorInputOrTrigger = clickedEl.closest('.text-color, .backcolor, .border-fill');
        if (!isColorInputOrTrigger) {
          this.showTextColorInput = false;
          this.showBackColorInput = false;
          this.showBorderColorInput = false;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.listeners.forEach(unlisten => unlisten());
  }
  
  private applyTextStyle(command: string, value?: string): void {
    this.restoreSelection();
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand(command, false, value);
    this.saveSelection();
  }

  toggleBold(): void {
    this.applyTextStyle('bold');
    this.isBoldActive = !this.isBoldActive;
    this.emitStyleChange({ fontWeight: this.isBoldActive ? 'bold' : 'normal' });
  }

  toggleItalic(): void {
    this.applyTextStyle('italic');
    this.isItalicActive = !this.isItalicActive;
    this.emitStyleChange({ fontStyle: this.isItalicActive ? 'italic' : 'normal' });
  }
  
  changeFontSize(size: string, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedFontSize = size;
    this.applyTextStyle('fontSize', '1'); // Hack to then set a span
    const fontElements = this.editableDiv.nativeElement.getElementsByTagName('font');
    for (const fontElement of fontElements) {
        if (fontElement.size === '1') {
            const span = this.renderer.createElement('span');
            span.style.fontSize = this.fontSizeMap[size];
            span.innerHTML = fontElement.innerHTML;
            fontElement.parentNode.replaceChild(span, fontElement);
        }
    }
    this.isTextSizeDropdownOpen = false;
    this.emitStyleChange({ fontSize: size });
  }

  changeTextColor(color: string): void {
    this.selectedColor = color;
    this.applyTextStyle('foreColor', color);
    this.emitStyleChange({ color: this.selectedColor });
  }

  changeBackgroundColor(color: string): void {
    this.selectedBackgroundColor = color;
    this.emitStyleChange({ backgroundColor: this.selectedBackgroundColor });
  }

  changeBorderColor(color: string): void {
    this.selectedBorderColor = color;
    this.emitStyleChange({ borderColor: this.selectedBorderColor });
  }

  changeTextAlign(align: string, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedTextAlign = align;
    this.isAlignmentDropdownOpen = false;
    this.emitStyleChange({ textAlign: this.selectedTextAlign });
  }

  changeVerticalAlign(align: string, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedVerticalAlign = align;
    this.isVerticalAlignmentDropdownOpen = false;
    this.emitStyleChange({ verticalAlign: this.selectedVerticalAlign });
  }
  
  saveSelection(): void {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && this.editableDiv?.nativeElement.contains(sel.anchorNode)) {
      this.savedSelection = sel.getRangeAt(0);
    } else {
      this.savedSelection = null;
    }
  }

  restoreSelection(): void {
    if (this.savedSelection) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(this.savedSelection);
    }
    this.editableDiv.nativeElement.focus();
  }

  handleColorIconClick(type: 'text' | 'background' | 'border'): void {
    this.showTextColorInput = type === 'text' ? !this.showTextColorInput : false;
    this.showBackColorInput = type === 'background' ? !this.showBackColorInput : false;
    this.showBorderColorInput = type === 'border' ? !this.showBorderColorInput : false;
  }

  insertLink(): void {
    this.restoreSelection();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      alert('Please select the text you want to link.');
      return;
    }
    const url = prompt('Enter the URL:');
    if (url) {
      this.applyTextStyle('createLink', url);
    }
  }

  onDeleteClick(): void {
    this.deleteClicked.emit();
  }
  
  private emitStyleChange(style: any): void {
    this.styleChanged.emit(style);
  }
}