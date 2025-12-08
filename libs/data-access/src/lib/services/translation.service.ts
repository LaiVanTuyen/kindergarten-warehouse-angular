import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Lang = 'en' | 'vi';

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private currentLangSubject = new BehaviorSubject<Lang>('en');
  currentLang$ = this.currentLangSubject.asObservable();

  private translations: Record<Lang, Record<string, string>> = {
    en: {
      'header.home': 'Home',
      'header.resources': 'Resources',
      'header.about': 'About',
      'header.login': 'Login',
      'header.logout': 'Logout',
      'home.latest': 'Latest Resources',
      'home.subtitle': 'Freshly added materials for your classroom',
      'home.viewAll': 'View All',
      'list.explore': 'Explore Resources',
      'list.all': 'All Resources',
      'list.search': 'Search resources...',
      'detail.back': 'Back to Resources',
      'detail.download': 'Download Resource',
      'detail.comments': 'User Comments',
      'detail.leaveComment': 'Leave a Comment',
      'detail.rating': 'Your Rating',
      'detail.yourComment': 'Your Comment',
      'detail.post': 'Post Comment',
      'detail.loginToComment': 'Please log in to share your thoughts.',
      'detail.loginBtn': 'Log In to Comment',
      'login.welcome': 'Welcome Back!',
      'login.subtitle': 'Please sign in to your account',
      'login.email': 'Email address',
      'login.password': 'Password',
      'login.remember': 'Remember me',
      'login.forgot': 'Forgot your password?',
      'login.signin': 'Sign in',
      'list.noResults': 'No resources found matching your selection.',
      'list.view': 'View',
      'list.download': 'Download',
      'list.views': 'views',
      'detail.noComments': 'No comments yet. Be the first to share your thoughts!',
      'banner.explore': 'Explore Now',
      'sort.newest': 'Newest First',
      'sort.nameAsc': 'Name (A-Z)',
      'sort.nameDesc': 'Name (Z-A)',
      'sort.ratingDesc': 'Rating (High to Low)',
      'sort.ratingAsc': 'Rating (Low to High)',
      'about.title': 'About',
      'about.welcome': 'Welcome to KinderWorld, your premier digital resource warehouse for kindergarten education. We are dedicated to providing high-quality, engaging, and educational materials for teachers, parents, and young learners.',
      'about.curated.title': 'Curated Content',
      'about.curated.desc': 'Hand-picked resources designed by educational experts.',
      'about.creative.title': 'Creative Learning',
      'about.creative.desc': 'Fostering creativity through interactive materials.',
      'about.global.title': 'Global Community',
      'about.global.desc': 'Connecting educators and families worldwide.',
      'detail.loading': 'Loading resource...',
      'detail.noDescription': 'No description available for this resource.',
    },
    vi: {
      'header.home': 'Trang Chủ',
      'header.resources': 'Tài Nguyên',
      'header.about': 'Giới Thiệu',
      'header.login': 'Đăng Nhập',
      'header.logout': 'Đăng Xuất',
      'home.latest': 'Tài Nguyên Mới Nhất',
      'home.subtitle': 'Tài liệu mới nhất cho lớp học của bạn',
      'home.viewAll': 'Xem Tất Cả',
      'list.explore': 'Khám Phá Tài Nguyên',
      'list.all': 'Tất Cả',
      'list.search': 'Tìm kiếm tài nguyên...',
      'list.noResults': 'Không tìm thấy tài nguyên nào phù hợp.',
      'list.view': 'Xem',
      'list.download': 'Tải về',
      'list.views': 'lượt xem',
      'detail.back': 'Quay lại',
      'detail.download': 'Tải Xuống',
      'detail.comments': 'Bình Luận',
      'detail.leaveComment': 'Viết Bình Luận',
      'detail.rating': 'Đánh Giá',
      'detail.yourComment': 'Nội Dung',
      'detail.post': 'Gửi Bình Luận',
      'detail.loginToComment': 'Vui lòng đăng nhập để bình luận.',
      'detail.loginBtn': 'Đăng Nhập để Bình Luận',
      'detail.noComments': 'Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ suy nghĩ của bạn!',
      'detail.loading': 'Đang tải tài nguyên...',
      'detail.noDescription': 'Không có mô tả cho tài nguyên này.',
      'login.welcome': 'Chào Mừng Trở Lại!',
      'login.subtitle': 'Vui lòng đăng nhập vào tài khoản của bạn',
      'login.email': 'Địa chỉ Email',
      'login.password': 'Mật khẩu',
      'login.remember': 'Ghi nhớ đăng nhập',
      'login.forgot': 'Quên mật khẩu?',
      'login.signin': 'Đăng Nhập',
      'banner.explore': 'Khám Phá Ngay',
      'sort.newest': 'Mới Nhất',
      'sort.nameAsc': 'Tên (A-Z)',
      'sort.nameDesc': 'Tên (Z-A)',
      'sort.ratingDesc': 'Đánh Giá (Cao - Thấp)',
      'sort.ratingAsc': 'Đánh Giá (Thấp - Cao)',
      'about.title': 'Giới Thiệu',
      'about.welcome': 'Chào mừng đến với KinderWorld, kho tài nguyên kỹ thuật số hàng đầu cho giáo dục mầm non. Chúng tôi cam kết cung cấp các tài liệu chất lượng cao, hấp dẫn và mang tính giáo dục cho giáo viên, phụ huynh và các em nhỏ.',
      'about.curated.title': 'Nội Dung Chọn Lọc',
      'about.curated.desc': 'Tài nguyên được tuyển chọn kỹ lưỡng bởi các chuyên gia giáo dục.',
      'about.creative.title': 'Học Tập Sáng Tạo',
      'about.creative.desc': 'Khơi dậy sự sáng tạo thông qua các tài liệu tương tác.',
      'about.global.title': 'Cộng Đồng Toàn Cầu',
      'about.global.desc': 'Kết nối các nhà giáo dục và gia đình trên toàn thế giới.',
    },
  };

  get currentLang(): Lang {
    return this.currentLangSubject.value;
  }

  setLanguage(lang: Lang) {
    this.currentLangSubject.next(lang);
  }

  translate(key: string): string {
    const lang = this.currentLang;
    return this.translations[lang][key] || key;
  }
}
