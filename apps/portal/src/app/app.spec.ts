import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app';
import { NxWelcome } from './nx-welcome';
import { provideRouter } from '@angular/router';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent, NxWelcome],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should render header', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-header')).toBeTruthy();
  });
});
