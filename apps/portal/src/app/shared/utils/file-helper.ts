export class FileHelper {
  static getFileIcon(type: string | undefined): string {
    if (!type) return 'assets/icons/file-generic.svg';
    const t = type.toUpperCase();
    switch (t) {
      case 'XLS':
      case 'XLSX':
      case 'EXCEL':
        return 'assets/icons/excel-colorful.svg';
      case 'DOC':
      case 'DOCX':
      case 'WORD':
        return 'assets/icons/word-colorful.svg';
      case 'PDF':
        return 'assets/icons/pdf-colorful.svg';
      case 'PPT':
      case 'PPTX':
      case 'POWERPOINT':
        return 'assets/icons/ppt-colorful.svg';
      case 'JPG':
      case 'JPEG':
      case 'PNG':
      case 'IMAGE':
        return 'assets/icons/image-colorful.svg';
      case 'MP4':
      case 'AVI':
      case 'VIDEO':
        return 'assets/icons/video-colorful.svg';
      case 'MP3':
      case 'WAV':
      case 'AUDIO':
        return 'assets/icons/audio-colorful.svg';
      default:
        return 'assets/icons/file-generic.svg';
    }
  }

  static getFileColorClass(type: string | undefined): string {
    if (!type) return 'bg-gray-100 text-gray-600';
    const t = type.toUpperCase();
    switch (t) {
      case 'XLS':
      case 'XLSX':
      case 'EXCEL':
        return 'bg-emerald-100 text-emerald-600';
      case 'DOC':
      case 'DOCX':
      case 'WORD':
        return 'bg-blue-100 text-blue-600';
      case 'PDF':
        return 'bg-rose-100 text-rose-600';
      case 'PPT':
      case 'PPTX':
      case 'POWERPOINT':
        return 'bg-orange-100 text-orange-600';
      case 'JPG':
      case 'JPEG':
      case 'PNG':
      case 'IMAGE':
        return 'bg-purple-100 text-purple-600';
      case 'Video':
      case 'VIDEO':
        return 'bg-indigo-100 text-indigo-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }
}
