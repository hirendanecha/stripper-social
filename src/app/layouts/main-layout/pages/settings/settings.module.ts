import { NgModule } from '@angular/core';

import { SettingsRoutingModule } from './settings-routing.module';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { ViewProfileComponent } from './view-profile/view-profile.component';
import { SeeFirstUserComponent } from './see-first-user/see-first-user.component';
import { UnsubscribedUsersComponent } from './unsubscribed-users/unsubscribed-users.component';
import { SharedModule } from 'src/app/@shared/shared.module';
import { DeleteAccountComponent } from './delete-account/delete-account.component';
import { CompleteProfileComponent } from './complete-profile/complete-profile.component';
import { SettingsComponent } from './settings.component';
import { SupportTicketPageComponent } from './support-ticket-page/support-ticket-page.component';
import { NotificationsModule } from '../notifications/notification.module';

@NgModule({
  declarations: [
    EditProfileComponent,
    ViewProfileComponent,
    DeleteAccountComponent,
    SeeFirstUserComponent,
    UnsubscribedUsersComponent,
    CompleteProfileComponent,
    SettingsComponent,
    SupportTicketPageComponent,
  ],
  imports: [SettingsRoutingModule, SharedModule, NotificationsModule],
})
export class SettingsModule {}
