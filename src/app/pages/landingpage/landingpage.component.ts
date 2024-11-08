import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import { ViewportScroller } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { RouterLink } from '@angular/router';

interface apps {
  id: number;
  img: string;
  title: string;
  subtitle: string;
  link: string;
}

interface quicklinks {
  id: number;
  title: string;
  link: string;
}

interface demos {
  id: number;
  name: string;
  url: string;
  imgSrc: string;
}

interface testimonials {
  id: number;
  name: string;
  subtext: string;
  imgSrc: string;
}

interface features {
  id: number;
  icon: string;
  title: string;
  subtext: string;
}

@Component({
  selector: 'app-landingpage',
  standalone: true,
  imports: [MaterialModule, TablerIconsModule, RouterLink],
  templateUrl: './landingpage.component.html',
})
export class AppLandingpageComponent {
  @Input() showToggle = true;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleMobileFilterNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<void>();

  options = this.settings.getOptions();

  constructor(
    private settings: CoreService,
    private scroller: ViewportScroller
  ) {}

  // scroll to demos
  gotoDemos() {
    this.scroller.scrollToAnchor('demos');
  }

  apps: apps[] = [
    {
      id: 1,
      img: '/assets/images/svgs/icon-dd-chat.svg',
      title: 'Chat Application',
      subtitle: 'Messages & Emails',
      link: '/apps/chat',
    },
    {
      id: 2,
      img: '/assets/images/svgs/icon-dd-cart.svg',
      title: 'Blog App',
      subtitle: 'Get a Blog',
      link: '/apps/blog/post',
    },
  ];

  demos: demos[] = [
    {
      id: 1,
      imgSrc: '/assets/images/landingpage/demos/demo-main.jpg',
      name: 'Main',
      url: 'https://materialpro-angular-main.netlify.app/dashboards/dashboard1',
    },
    {
      id: 2,
      imgSrc: '/assets/images/landingpage/demos/demo-dark.jpg',
      name: 'Dark',
      url: 'https://materialpro-angular-dark.netlify.app/dashboards/dashboard2',
    },
    {
      id: 3,
      imgSrc: '/assets/images/landingpage/demos/demo-firebase.jpg',
      name: 'Authguard',
      url: 'https://materialpro-angular-authguard.netlify.app/authentication-side-login',
    },
    {
      id: 4,
      imgSrc: '/assets/images/landingpage/demos/demo-rtl.jpg',
      name: 'RTL',
      url: 'https://materialpro-angular-rtl.netlify.app/dashboards/dashboard1',
    },
    {
      id: 5,
      imgSrc: '/assets/images/landingpage/demos/demo-minisidebar.jpg',
      name: 'Minisidebar',
      url: 'https://materialpro-angular-minisidebar.netlify.app/dashboards/dashboard1',
    },
    {
      id: 6,
      imgSrc: '/assets/images/landingpage/demos/demo-horizontal.jpg',
      name: 'Horizontal',
      url: 'https://materialpro-angular-horizontal.netlify.app/dashboards/dashboard2',
    },
  ];

  appdemos: demos[] = [
    {
      id: 1,
      imgSrc: '/assets/images/landingpage/apps/app-calendar.jpg',
      name: 'Calendar',
      url: 'https://materialpro-angular-main.netlify.app/apps/calendar',
    },
    {
      id: 2,
      imgSrc: '/assets/images/landingpage/apps/app-chat.jpg',
      name: 'Chat',
      url: 'https://materialpro-angular-main.netlify.app/apps/chat',
    },
    {
      id: 3,
      imgSrc: '/assets/images/landingpage/apps/app-contact.jpg',
      name: 'Contact',
      url: 'https://materialpro-angular-main.netlify.app/apps/contacts',
    },
    {
      id: 4,
      imgSrc: '/assets/images/landingpage/apps/app-email.jpg',
      name: 'Email',
      url: 'https://materialpro-angular-main.netlify.app/apps/email/inbox',
    },
    {
      id: 5,
      imgSrc: '/assets/images/landingpage/apps/app-courses.jpg',
      name: 'Courses',
      url: 'https://materialpro-angular-main.netlify.app/apps/courses',
    },
    {
      id: 6,
      imgSrc: '/assets/images/landingpage/apps/app-employee.jpg',
      name: 'Employee',
      url: 'https://materialpro-angular-main.netlify.app/apps/employee',
    },
    {
      id: 7,
      imgSrc: '/assets/images/landingpage/apps/app-note.jpg',
      name: 'Notes',
      url: 'https://materialpro-angular-main.netlify.app/apps/notes',
    },
    {
      id: 8,
      imgSrc: '/assets/images/landingpage/apps/app-ticket.jpg',
      name: 'Tickets',
      url: 'https://materialpro-angular-main.netlify.app/apps/tickets',
    },
    {
      id: 9,
      imgSrc: '/assets/images/landingpage/apps/app-invoice.jpg',
      name: 'Invoice',
      url: 'https://materialpro-angular-main.netlify.app/apps/invoice',
    },
    {
      id: 10,
      imgSrc: '/assets/images/landingpage/apps/app-todo.jpg',
      name: 'Todo',
      url: 'https://materialpro-angular-main.netlify.app/apps/todo',
    },
    {
      id: 11,
      imgSrc: '/assets/images/landingpage/apps/app-taskboard.jpg',
      name: 'Taskboard',
      url: 'https://materialpro-angular-main.netlify.app/apps/taskboard',
    },
    {
      id: 12,
      imgSrc: '/assets/images/landingpage/apps/app-blog.jpg',
      name: 'Blog List',
      url: 'https://materialpro-angular-main.netlify.app/apps/blog/post',
    },
  ];

  testimonials: testimonials[] = [
    {
      id: 1,
      imgSrc: '/assets/images/profile/user-1.jpg',
      name: 'Ajit Singh',
      subtext: 'The theme is very flexible with most of the content already available. And also the support team is very active. :)',
    },
    {
      id: 2,
      imgSrc: '/assets/images/profile/user-2.jpg',
      name: 'Kévin PEREZ',
      subtext: 'This design is really good. The code is good. Its easy to start with it when we are new with Angular. Like this theme because its a material theme !',
    },
    {
      id: 3,
      imgSrc: '/assets/images/profile/user-3.jpg',
      name: 'Jikes Sam',
      subtext: 'I am using the MaterialPro angular admin, and its feature rich, easy to use and saves a ton of time. The Support Team is great.',
    },
  ];

  features: features[] = [
    {
      id: 1,
      icon: 'wand',
      title: '6 Theme Colors',
      subtext:
        'We have included 6 pre-defined Theme Colors with Materialpro Admin.',
    },
    {
      id: 2,
      icon: 'shield-lock',
      title: 'Authguard',
      subtext:
        'AuthGuard is used to protect the routes from unauthorized access',
    },
    {
      id: 3,
      icon: 'archive',
      title: '80+ Page Templates',
      subtext: 'Yes, we have 6 demos & 80+ Pages per demo to make it easier.',
    },
    {
      id: 4,
      icon: 'adjustments',
      title: '50+ UI Components',
      subtext:
        'Almost 50+ UI Components being given with Materialpro Admin Pack.',
    },
    {
      id: 5,
      icon: 'tag',
      title: 'Material ',
      subtext: 'Its been made with Material and full responsive layout.',
    },
    {
      id: 6,
      icon: 'diamond',
      title: '3400+ Font Icons',
      subtext:
        'Lots of Icon Fonts are included here in the package of Materialpro Admin.',
    },
    {
      id: 7,
      icon: 'language-katakana',
      title: 'i18 Angular',
      subtext: 'i18 is a powerful internationalization framework for React.',
    },
    {
      id: 8,
      icon: 'arrows-shuffle',
      title: 'Easy to Customize',
      subtext: 'Customization will be easy as we understand your pain.',
    },
    {
      id: 9,
      icon: 'chart-pie',
      title: 'Lots of Chart Options',
      subtext: 'You name it and we have it, Yes lots of variations for Charts.',
    },
    {
      id: 10,
      icon: 'layers-intersect',
      title: 'Lots of Table Examples',
      subtext: 'Data Tables are initial requirement and we added them.',
    },
    {
      id: 11,
      icon: 'refresh',
      title: 'Regular Updates',
      subtext: 'We are constantly updating our pack with new features..',
    },
    {
      id: 12,
      icon: 'book',
      title: 'Detailed Documentation',
      subtext: 'We have made detailed documentation, so it will easy to use.',
    },
    {
      id: 13,
      icon: 'calendar',
      title: 'Calendar Design',
      subtext: 'Calendar is available with our package & in nice design.',
    },
    {
      id: 14,
      icon: 'messages',
      title: 'Dedicated Support',
      subtext: 'We believe in supreme support is key and we offer that.',
    },
  ];

  quicklinks: quicklinks[] = [
    {
      id: 1,
      title: 'Pricing Page',
      link: '/theme-pages/pricing',
    },
    {
      id: 2,
      title: 'Authentication Design',
      link: '/authentication/login',
    }
  ];
}
