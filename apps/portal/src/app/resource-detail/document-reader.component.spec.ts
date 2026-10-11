import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Resource, environment } from '@kindergarten-warehouse/data-access';
import { DocumentReaderComponent } from './document-reader.component';

describe('DocumentReaderComponent', () => {
  let http: HttpTestingController;
  const resource = { id: 'document-1', title: 'Học liệu mẫu' } as Resource;
  const metadata = `${environment.apiUrl}/resources/document-1/preview`;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DocumentReaderComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('uses a cookie-authenticated preview API, not Google or the original download', fakeAsync(() => {
    const fixture = TestBed.createComponent(DocumentReaderComponent);
    fixture.componentRef.setInput('resource', resource);
    tick();
    const request = http.expectOne(metadata);
    expect(request.request.withCredentials).toBe(true);
    request.flush({
      result: {
        status: 'READY',
        pageCount: 3,
        totalPages: 3,
        truncated: false,
      },
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe(
      `${environment.apiUrl}/resources/document-1/preview/pages/1`
    );
    expect(fixture.nativeElement.querySelector('iframe')).toBeNull();
    tick(5000);
    http.expectNone(metadata);
    fixture.destroy();
  }));

  it('polls processing jobs then stops once ready', fakeAsync(() => {
    const fixture = TestBed.createComponent(DocumentReaderComponent);
    fixture.componentRef.setInput('resource', resource);
    tick();
    http.expectOne(metadata).flush({ result: { status: 'PROCESSING' } });
    tick(2500);
    http
      .expectOne(metadata)
      .flush({ result: { status: 'READY', pageCount: 2, totalPages: 2 } });
    expect(fixture.componentInstance.manifest()?.status).toBe('READY');
    tick(5000);
    http.expectNone(metadata);
    fixture.destroy();
  }));

  it('bounds page and zoom values and supports resetting width', fakeAsync(() => {
    const fixture = TestBed.createComponent(DocumentReaderComponent);
    fixture.componentRef.setInput('resource', resource);
    tick();
    http
      .expectOne(metadata)
      .flush({ result: { status: 'READY', pageCount: 3, totalPages: 3 } });
    const reader = fixture.componentInstance;
    reader.goTo(900);
    expect(reader.page()).toBe(3);
    reader.goTo(-9);
    expect(reader.page()).toBe(1);
    reader.goTo('bad');
    expect(reader.page()).toBe(1);
    reader.changeZoom(500);
    expect(reader.zoom()).toBe(300);
    reader.changeZoom(-500);
    expect(reader.zoom()).toBe(60);
    fixture.destroy();
  }));

  it('shows a useful access error and does not poll forever on 404', fakeAsync(() => {
    const fixture = TestBed.createComponent(DocumentReaderComponent);
    fixture.componentRef.setInput('resource', resource);
    tick();
    http
      .expectOne(metadata)
      .flush({}, { status: 404, statusText: 'Not found' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('không có quyền xem');
    tick(5000);
    http.expectNone(metadata);
    fixture.destroy();
  }));

  it('cancels the previous job on route change and unsubscribes on destruction', fakeAsync(() => {
    const fixture = TestBed.createComponent(DocumentReaderComponent);
    fixture.componentRef.setInput('resource', resource);
    tick();
    http.expectOne(metadata).flush({ result: { status: 'PROCESSING' } });
    fixture.componentRef.setInput('resource', {
      ...resource,
      id: 'document-2',
    });
    tick();
    http
      .expectOne(`${environment.apiUrl}/resources/document-2/preview`)
      .flush({ result: { status: 'PROCESSING' } });
    fixture.destroy();
    tick(10000);
    http.expectNone(metadata);
    http.expectNone(`${environment.apiUrl}/resources/document-2/preview`);
  }));

  it('does not cancel a slow metadata response on the next poll tick', fakeAsync(() => {
    const fixture = TestBed.createComponent(DocumentReaderComponent);
    fixture.componentRef.setInput('resource', resource);
    tick();
    const request = http.expectOne(metadata);
    tick(3000);
    expect(request.cancelled).toBe(false);
    http.expectNone(metadata);
    request.flush({ result: { status: 'READY', pageCount: 1, totalPages: 1 } });
    expect(fixture.componentInstance.manifest()?.status).toBe('READY');
    fixture.destroy();
  }));

  it('ends processing after five minutes and exposes manual retry', fakeAsync(() => {
    const fixture = TestBed.createComponent(DocumentReaderComponent);
    fixture.componentRef.setInput('resource', resource);
    tick();
    for (let index = 0; index <= 120; index++) {
      if (index > 0) tick(2500);
      http.expectOne(metadata).flush({ result: { status: 'PROCESSING' } });
    }
    expect(fixture.componentInstance.manifest()?.status).toBe('BUSY');
    tick(5000);
    http.expectNone(metadata);
    fixture.destroy();
  }));

  it('resets fullscreen state after a native exit event', () => {
    const fixture = TestBed.createComponent(DocumentReaderComponent);
    fixture.componentInstance.isFullscreen.set(true);
    fixture.componentInstance.onFullscreenChange();
    expect(fixture.componentInstance.isFullscreen()).toBe(false);
    fixture.destroy();
  });
});
