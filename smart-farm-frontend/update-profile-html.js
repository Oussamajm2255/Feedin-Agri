const fs = require('fs');
const html = fs.readFileSync('src/app/features/profile/profile.component.html', 'utf8');

// The layout consists of:
// 1. .profile-header-card (lines 4-29 roughly)
// 2. .profile-content (lines 31-386)
// We will wrap the original in ng-template #farmerLayout, and place the admin layout above it.

const headerStart = html.indexOf('<!-- Enhanced Profile Header with Avatar -->');
const profileContentStart = html.indexOf('<!-- Tabs for Different Sections -->');

const beforeHeader = html.substring(0, headerStart);
const farmerHeader = html.substring(headerStart, profileContentStart);
const profileContent = html.substring(profileContentStart, html.lastIndexOf('</div>')); 
const afterProfileContent = html.substring(html.lastIndexOf('</div>'));

// Extract forms from profileContent to make them shared templates
const personalInfoFormStart = html.indexOf('<form [formGroup]="profileForm"');
const personalInfoFormEnd = html.indexOf('</form>', personalInfoFormStart) + 7;
const personalInfoForm = html.substring(personalInfoFormStart, personalInfoFormEnd);

const securityFormStart = html.indexOf('<form [formGroup]="passwordForm"');
const securityFormEnd = html.indexOf('</form>', securityFormStart) + 7;
let securityForm = html.substring(securityFormStart, securityFormEnd);

// Add autocompletes to password form
securityForm = securityForm.replace('formControlName="currentPassword"', 'formControlName="currentPassword" autocomplete="current-password"');
securityForm = securityForm.replace('formControlName="newPassword"', 'formControlName="newPassword" autocomplete="new-password"');
securityForm = securityForm.replace('formControlName="confirmPassword"', 'formControlName="confirmPassword" autocomplete="new-password"');

const accountInfoStart = html.indexOf('<div class="account-info"');
let accountInfoEnd = html.indexOf('</div>', html.indexOf('<div class="info-card"', html.indexOf('mail_outline'))); // rough search for the end of account-info
// A safer way to find the end of account-info: count divs
let divCount = 0;
let currentIndex = accountInfoStart;
while (currentIndex < html.length) {
  const nextOpen = html.indexOf('<div', currentIndex + 1);
  const nextClose = html.indexOf('</div', currentIndex + 1);
  
  if (nextClose === -1) break;
  
  if (nextOpen !== -1 && nextOpen < nextClose) {
    divCount++;
    currentIndex = nextOpen;
  } else {
    divCount--;
    currentIndex = nextClose;
    if (divCount === 0) {
      accountInfoEnd = nextClose + 6;
      break;
    }
  }
}
const accountInfo = html.substring(accountInfoStart, accountInfoEnd);


// Now build the new HTML
const newHtml = beforeHeader + 
\`<ng-container *ngIf="isAdminShell; else farmerLayout">
  <!-- Premium Admin Layout -->
  <div class="admin-header-banner">
    <div class="admin-shield-wrapper">
      <div class="shield-pulse"></div>
      <mat-icon class="admin-shield-icon">admin_panel_settings</mat-icon>
    </div>
    <div class="admin-header-info">
      <h1 class="admin-name" *ngIf="user()">
        {{ user()?.first_name }} {{ user()?.last_name }}
      </h1>
      <div class="admin-badge">
        <mat-icon>verified</mat-icon>
        <span>Verified Admin</span>
      </div>
    </div>
  </div>

  <div class="admin-profile-grid">
    <div class="admin-left-col">
      <div class="admin-card frosted-glass">
        <div class="section-header">
          <div class="section-title">
            <mat-icon>badge</mat-icon>
            <h2>{{ 'profile.personalInfo' | translate }}</h2>
          </div>
          <p class="section-subtitle">{{ 'profile.descriptions.personalInfo' | translate }}</p>
        </div>
        <ng-container *ngTemplateOutlet="personalInfoFormTpl"></ng-container>
      </div>

      <div class="admin-card frosted-glass">
        <div class="section-header">
          <div class="section-title">
            <mat-icon>shield</mat-icon>
            <h2>{{ 'profile.changePassword' | translate }}</h2>
          </div>
          <p class="section-subtitle">{{ 'profile.descriptions.security' | translate }}</p>
        </div>
        <ng-container *ngTemplateOutlet="securityFormTpl"></ng-container>
      </div>
    </div>

    <div class="admin-right-col">
      <div class="admin-card frosted-glass">
        <div class="section-header">
          <div class="section-title">
            <mat-icon>admin_panel_settings</mat-icon>
            <h2>{{ 'profile.accountInfo' | translate }}</h2>
          </div>
          <p class="section-subtitle">{{ 'profile.descriptions.accountInfo' | translate }}</p>
        </div>
        <ng-container *ngTemplateOutlet="accountInfoTpl"></ng-container>
      </div>
    </div>
  </div>
</ng-container>

<ng-template #farmerLayout>
\` + 
  farmerHeader.replace(personalInfoForm, '<ng-container *ngTemplateOutlet="personalInfoFormTpl"></ng-container>') + 
  profileContent.replace(personalInfoForm, '<ng-container *ngTemplateOutlet="personalInfoFormTpl"></ng-container>')
                .replace(html.substring(securityFormStart, securityFormEnd), '<ng-container *ngTemplateOutlet="securityFormTpl"></ng-container>')
                .replace(html.substring(accountInfoStart, accountInfoEnd), '<ng-container *ngTemplateOutlet="accountInfoTpl"></ng-container>') + 
\`
</ng-template>

<!-- SHARED TEMPLATES -->
<ng-template #personalInfoFormTpl>
\` + personalInfoForm + \`
</ng-template>

<ng-template #securityFormTpl>
\` + securityForm + \`
</ng-template>

<ng-template #accountInfoTpl>
\` + accountInfo + \`
</ng-template>
\` + afterProfileContent;

fs.writeFileSync('src/app/features/profile/profile.component.html', newHtml);
console.log('Successfully refactored Profile component HTML');
