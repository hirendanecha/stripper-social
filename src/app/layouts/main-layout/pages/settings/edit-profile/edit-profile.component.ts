import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subject, debounceTime, forkJoin, fromEvent, of } from 'rxjs';
import { ConfirmationModalComponent } from 'src/app/@shared/modals/confirmation-modal/confirmation-modal.component';
import { Customer } from 'src/app/@shared/constant/customer';
import { CustomerService } from 'src/app/@shared/services/customer.service';
import { PostService } from 'src/app/@shared/services/post.service';
import { SharedService } from 'src/app/@shared/services/shared.service';
import { TokenStorageService } from 'src/app/@shared/services/token-storage.service';
import { ToastService } from 'src/app/@shared/services/toast.service';
import { UploadFilesService } from 'src/app/@shared/services/upload-files.service';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss'],
})
export class EditProfileComponent implements OnInit, AfterViewInit {
  customer: any = '';
  allCountryData: any;
  confirm_password = '';
  msg = '';
  userId = '';
  userMail: string;
  profilePic: any = {};
  coverPic: any = {};
  profileId: number;
  userlocalId: number;
  profileData: any = {};
  @ViewChild('zipCode') zipCode: ElementRef;
  uploadListSubject: Subject<void> = new Subject<void>();
  profileImg: any = {
    file: null,
    url: '',
  };
  profileCoverImg: any = {
    file: null,
    url: '',
  };
  isNotificationSoundEnabled: boolean = true;

  constructor(
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private router: Router,
    private customerService: CustomerService,
    private spinner: NgxSpinnerService,
    private tokenStorage: TokenStorageService,
    private postService: PostService,
    public sharedService: SharedService,
    private toastService: ToastService,
    private uploadService: UploadFilesService,
  ) {
    this.userlocalId = +localStorage.getItem('user_id');
    this.userId = this.route.snapshot.paramMap.get('id');
    this.profileId = +this.tokenStorage.getUser().profileId as any;
    this.userMail = localStorage.getItem('email');
    if (this.profileId) {
      this.getProfile(this.profileId);
    }
    // else {
    //   this.getUserDetails(this.userId);
    // }
  }
  ngOnInit(): void {
    if (!this.tokenStorage.getToken()) {
      this.router.navigate([`/login`]);
    }
    this.modalService.dismissAll();
    const notificationSound = localStorage.getItem('notificationSoundEnabled');
    if (notificationSound === 'N') {
      this.isNotificationSoundEnabled = false
    }
  }

  ngAfterViewInit(): void {
    fromEvent(this.zipCode.nativeElement, 'input')
      .pipe(debounceTime(1000))
      .subscribe((event) => {
        this.onZipChange(event['target'].value);
      });
  }

  getUserDetails(id): void {
    this.spinner.show();
    this.customerService.getCustomer(id).subscribe(
      (data: any) => {
        if (data) {
          this.spinner.hide();
          this.customer = data;
          console.log(data);
          this.getAllCountries();
        }
      },
      (err) => {
        this.spinner.hide();
        console.log(err);
      }
    );
  }

  validatepassword() {
    const pattern =
      '(?=.*[A-Z])(?=.*[!@#$&*])(?=.*[a-z])(?=.*[0-9].*[0-9]).{8}';
    if (!this.customer.Password.match(pattern)) {
      this.msg =
        'Password must be a minimum of 8 characters and include one uppercase letter, one lowercase letter and one special character';
    }
    if (this.customer.Password !== this.confirm_password) {
      this.msg = 'Passwords does not match.';
      return false;
    }

    return true;
  }

  changeCountry() {
    console.log('change');

    this.customer.zip = '';
    this.customer.state = '';
    this.customer.city = '';
    this.customer.county = '';
    // this.customer.Place = '';
  }

  changetopassword(event) {
    event.target.setAttribute('type', 'password');
    this.msg = '';
  }

  getAllCountries() {
    this.customerService.getCountriesData().subscribe(
      {
        next: (result) => {
          this.allCountryData = result;
        },
        error:
          (error) => {
            console.log(error);
          },
      });
  }

  onZipChange(event) {
    this.customerService.getZipData(event, this.customer?.country).subscribe({
      next: (data) => {
        let zip_data = data[0];
        this.customer.state = zip_data ? zip_data.state : '';
        this.customer.city = zip_data ? zip_data.places : '';
        this.customer.county = zip_data ? zip_data.places : '';
        // this.customer.Place = zip_data ? zip_data.places : '';
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  confirmAndUpdateCustomer(): void {
    if (this.profileId) {
      const modalRef = this.modalService.open(ConfirmationModalComponent, {
        centered: true,
      });
      modalRef.componentInstance.title = 'Update Profile';
      modalRef.componentInstance.confirmButtonLabel = 'Update';
      modalRef.componentInstance.cancelButtonLabel = 'Cancel';
      modalRef.componentInstance.message = 'Are you sure want to update profile details?';

      modalRef.result.then((res) => {
        if (res === 'success') {
          this.uploadImgAndUpdateCustomer();
        }
      });
    }

  }

  uploadImgAndUpdateCustomer(): void {
    let uploadObs = {};
    if (this.profileImg?.file?.name) {
      uploadObs['profileImg'] = this.uploadService.uploadFile(this.profileImg?.file);
    }

    if (this.profileCoverImg?.file?.name) {
      uploadObs['profileCoverImg'] = this.uploadService.uploadFile(this.profileCoverImg?.file);
    }

    if (Object.keys(uploadObs)?.length > 0) {
      this.spinner.show();

      forkJoin(uploadObs).subscribe({
        next: (res: any) => {
          console.log(res);
          if (res?.profileImg?.body?.url) {
            this.profileImg['file'] = null;
            this.profileImg['url'] = res?.profileImg?.body?.url;
            this.sharedService['userData']['profilePicName'] = this.profileImg['url'];
          }

          if (res?.profileCoverImg?.body?.url) {
            this.profileCoverImg['file'] = null;
            this.profileCoverImg['url'] = res?.profileCoverImg?.body?.url;
            this.sharedService['userData']['CoverPicName'] = this.profileCoverImg['url'];
          }

          this.updateCustomer();
          this.spinner.hide();
        },
        error: (err) => {
          this.spinner.hide();
        },
      });
    } else {
      this.updateCustomer();
    }
  }

  updateCustomer(): void {
    if (this.profileId) {
      this.spinner.show();
      this.customer.profilePicName = this.profileImg?.url || this.customer.profilePicName;
      this.customer.CoverPicName = this.profileCoverImg?.url || this.customer.CoverPicName;
      this.customer.IsActive = 'Y';
      this.customer.UserID = +this.userId;
      console.log('update', this.customer)
      this.customerService.updateProfile(this.profileId, this.customer).subscribe({
        next: (res: any) => {
          this.spinner.hide();
          if (!res.error) {
            this.toastService.success(res.message);
            this.sharedService.getUserDetails();
          } else {
            // this.toastService.danger(res?.message);
            this.toastService.danger('something went wrong please try again!');
          }
        },
        error: (error) => {
          console.log(error.error.message);
          this.spinner.hide();
          // this.toastService.danger(error.error.message);
          this.toastService.danger('something went wrong please try again!');
        }
      });
    }
  }

  getProfile(id): void {
    this.spinner.show();
    this.customerService.getProfile(id).subscribe({
      next: (res: any) => {
        this.spinner.hide();
        if (res.data) {
          this.customer = res.data;
          console.log("customer  : ", this.customer)
          this.getAllCountries();
        }
      },
      error:
        (error) => {
          this.spinner.hide();
          console.log(error);
        }
    });
  }

  onProfileImgChange(event: any): void {
    this.profileImg = event;
  }

  onProfileCoverImgChange(event: any): void {
    this.profileCoverImg = event;
  }

  deleteAccount(): void {
    const modalRef = this.modalService.open(ConfirmationModalComponent, {
      centered: true,
    });
    modalRef.componentInstance.title = 'Delete Account';
    modalRef.componentInstance.confirmButtonLabel = 'Delete';
    modalRef.componentInstance.cancelButtonLabel = 'Cancel';
    modalRef.componentInstance.message =
      'Are you sure want to delete your account?';
    modalRef.result.then((res) => {
      if (res === 'success') {
        this.customerService.deleteCustomer(this.userlocalId, this.profileId).subscribe({
          next: (res: any) => {
            if (res) {
              this.toastService.success(res.message || 'Account deleted successfully');
              this.tokenStorage.signOut();
              this.router.navigateByUrl('register');
            }
          },
          error: (error) => {
            console.log(error);
            this.toastService.success(error.message);
          },
        });
      }
    });
  }
  onChangeTag(event) {
    this.customer.userName = event.target.value.replaceAll(' ', '');
    console.log(this.customer.userName);
  }

  notificationSound(): void {
    const soundOct = localStorage.getItem('notificationSoundEnabled');
    if (soundOct === 'Y') {
      localStorage.setItem('notificationSoundEnabled', 'N');
    } else {
      localStorage.setItem('notificationSoundEnabled', this.isNotificationSoundEnabled ? 'Y' : 'N');
    }
  }

  convertToUppercase(event: any) {
    const inputElement = event.target as HTMLInputElement;
    let inputValue = inputElement.value;
    inputValue = inputValue.replace(/\s/g, '');
    inputElement.value = inputValue.toUpperCase();
  }
}