import { ContentSection } from '../components/content-section'
import { ProfileForm } from './profile-form'

export function SettingsProfile() {
  return (
    <ContentSection title='Akun' desc='Kelola informasi akun dan kata sandi Anda.'>
      <ProfileForm />
    </ContentSection>
  )
}
