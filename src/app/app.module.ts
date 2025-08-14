import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms'; 
import { GridsterModule } from 'angular-gridster2'; 

import { AppComponent } from './app.component';
import { EditorComponent } from './editor/editor.component';
import { GridsterWrapperComponent } from './gridster-wrapper/gridster-wrapper.component';
import { TextAreaComponent } from './text-area/text-area.component';
import { TextBarComponent } from './text-bar/text-bar.component';
import { ImageBarComponent } from './image-bar/image-bar.component';
import { ImageAreaComponent } from './image-area/image-area.component';

@NgModule({
  declarations: [
    AppComponent,
    EditorComponent,
    GridsterWrapperComponent,
    TextAreaComponent,
    TextBarComponent,
    ImageBarComponent,
    ImageAreaComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,      
    FormsModule,       
    GridsterModule     
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }