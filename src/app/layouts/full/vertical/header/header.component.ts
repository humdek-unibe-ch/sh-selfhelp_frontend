import {
   Component,
   Output,
   EventEmitter,
   Input,
   ViewEncapsulation,
} from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import { MatDialog } from '@angular/material/dialog';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { RouterModule } from '@angular/router';
import { CommonModule, NgForOf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { BrandingComponent } from '../sidebar/branding.component';
import { NavigationService } from 'src/app/services/api/navigation.service';
import { Observable } from 'rxjs';
import { NavItem } from '../sidebar/nav-item/nav-item';
import { SearchDialogComponent } from 'src/app/layouts/search-dialog/search-dialog.component';

interface notifications {
   id: number;
   img: string;
   title: string;
   subtitle: string;
}

interface msgs {
   id: number;
   img: string;
   title: string;
   subtitle: string;
}

interface profiledd {
   id: number;
   img: string;
   title: string;
   subtitle: string;
   link: string;
}

@Component({
   selector: 'app-header',
   standalone: true,
   imports: [RouterModule, CommonModule, NgScrollbarModule, TablerIconsModule, MaterialModule, BrandingComponent],
   templateUrl: './header.component.html',
   encapsulation: ViewEncapsulation.None,
})
export class HeaderComponent {
   @Input() showToggle = true;
   @Input() toggleChecked = false;
   @Output() toggleMobileNav = new EventEmitter<void>();
   @Output() toggleMobileFilterNav = new EventEmitter<void>();
   @Output() toggleCollapsed = new EventEmitter<void>();

   showFiller = false;

   public selectedLanguage: any = {
      language: 'English',
      code: 'en',
      type: 'US',
      icon: '/assets/images/flag/icon-flag-en.svg',
   };

   public languages: any[] = [
      {
         language: 'English',
         code: 'en',
         type: 'US',
         icon: '/assets/images/flag/icon-flag-en.svg',
      },
      {
         language: 'Español',
         code: 'es',
         icon: '/assets/images/flag/icon-flag-es.svg',
      },
      {
         language: 'Français',
         code: 'fr',
         icon: '/assets/images/flag/icon-flag-fr.svg',
      },
      {
         language: 'German',
         code: 'de',
         icon: '/assets/images/flag/icon-flag-de.svg',
      },
   ];

   constructor(
      private vsidenav: CoreService,
      public dialog: MatDialog,
   ) {
   }

   openDialog() {
      const dialogRef = this.dialog.open(SearchDialogComponent);

      dialogRef.afterClosed().subscribe((result) => {
         console.log(`Dialog result: ${result}`);
      });
   }

   changeLanguage(lang: any): void {
      this.selectedLanguage = lang;
   }

   notifications: notifications[] = [
      {
         id: 1,
         img: '/assets/images/profile/user-1.jpg',
         title: 'Roman Joined the Team!',
         subtitle: 'Congratulate him',
      },
      {
         id: 2,
         img: '/assets/images/profile/user-2.jpg',
         title: 'New message received',
         subtitle: 'Salma sent you new message',
      },
      {
         id: 3,
         img: '/assets/images/profile/user-3.jpg',
         title: 'New Payment received',
         subtitle: 'Check your earnings',
      },
      {
         id: 4,
         img: '/assets/images/profile/user-4.jpg',
         title: 'Jolly completed tasks',
         subtitle: 'Assign her new tasks',
      },
      {
         id: 5,
         img: '/assets/images/profile/user-5.jpg',
         title: 'Roman Joined the Team!',
         subtitle: 'Congratulate him',
      },
   ];

   msgs: msgs[] = [
      {
         id: 1,
         img: '/assets/images/profile/user-1.jpg',
         title: 'Andrew McDownland',
         subtitle: 'Message blocked. Try Again',
      },
      {
         id: 2,
         img: '/assets/images/profile/user-2.jpg',
         title: 'Christopher Jamil',
         subtitle: 'This message cannot be sent',
      },
      {
         id: 3,
         img: '/assets/images/profile/user-3.jpg',
         title: 'Julia Roberts',
         subtitle: 'You are trying to reach location.',
      },
      {
         id: 4,
         img: '/assets/images/profile/user-4.jpg',
         title: 'James Johnson',
         subtitle: 'Assign her new tasks',
      },
      {
         id: 5,
         img: '/assets/images/profile/user-5.jpg',
         title: 'Maria Rodriguez',
         subtitle: 'Congrats for your success',
      },
   ];

   profiledd: profiledd[] = [
      {
         id: 1,
         img: '/assets/images/svgs/icon-account.svg',
         title: 'My Profile',
         subtitle: 'Account Settings',
         link: '/',
      },
      {
         id: 2,
         img: '/assets/images/svgs/icon-inbox.svg',
         title: 'My Inbox',
         subtitle: 'Messages & Email',
         link: '/apps/email/inbox',
      },
      {
         id: 3,
         img: '/assets/images/svgs/icon-tasks.svg',
         title: 'My Tasks',
         subtitle: 'To-do and Daily Tasks',
         link: '/apps/taskboard',
      },
   ];
}
