import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ChangeDetectionStrategy
} from '@angular/core';

@Component({
  selector: 'app-image-bar',
  templateUrl: './image-bar.component.html',
  styleUrls: ['./image-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageBarComponent {
  @Input() imageRef!: ElementRef;
  @Output() deleteClicked = new EventEmitter<void>();
  @Output() replaceImageRequested = new EventEmitter<void>();
  @Output() linkAdded = new EventEmitter<string>();

  triggerFileReplace(): void {
    this.replaceImageRequested.emit();
  }

  addLinkToImage(): void {
    const url = prompt('Enter link URL:');
    if (url) {
      let finalUrl = url.trim();
      if (!/^(https?:\/\/|mailto:|tel:)/i.test(finalUrl)) {
        finalUrl = 'https://' + finalUrl;
      }
      this.linkAdded.emit(finalUrl);
    }
  }

  onDeleteClick(): void {
    this.deleteClicked.emit();
  }
}