import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component} from '@angular/core';

@Component({
    selector: 'app-frontend-page',
    standalone: true,
    imports: [
        CommonModule,
    ],
    templateUrl: './frontend-page.component.html',
    styleUrl: './frontend-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FrontendPageComponent  {

}
