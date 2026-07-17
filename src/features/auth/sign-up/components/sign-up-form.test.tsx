import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, type RenderResult } from 'vitest-browser-react'
import { type Locator, userEvent } from 'vitest/browser'
import { SignUpForm } from './sign-up-form'

const FORM_MESSAGES = {
  nameEmpty: 'Please enter your name.',
  emailEmpty: 'Please enter your email.',
  passwordEmpty: 'Please enter your password.',
  confirmPasswordEmpty: 'Please confirm your password.',
  passwordMismatch: "Passwords don't match.",
} as const

const postMock = vi.hoisted(() => vi.fn())
const navigateMock = vi.hoisted(() => vi.fn())
const toastMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))

vi.mock('sonner', () => ({ toast: toastMock }))
vi.mock('@/lib/axios', () => ({ api: { post: postMock } }))
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigateMock }))
// Tombol Google memuat Google Identity Services — tak relevan untuk unit test.
vi.mock('../../components/google-auth-button', () => ({
  GoogleAuthButton: () => null,
}))

describe('SignUpForm', () => {
  let screen: RenderResult
  let nameInput: Locator
  let emailInput: Locator
  let passwordInput: Locator
  let confirmPasswordInput: Locator
  let submitButton: Locator

  beforeEach(async () => {
    vi.clearAllMocks()
    postMock.mockResolvedValue({
      data: {
        accessToken: 'token-123',
        user: {
          id: 'u1',
          email: 'a@b.com',
          name: 'Budi',
          role: 'OWNER',
          ownerId: 'u1',
        },
      },
    })

    screen = await render(<SignUpForm />)
    nameInput = screen.getByRole('textbox', { name: /^Name$/i })
    emailInput = screen.getByRole('textbox', { name: /^Email$/i })
    passwordInput = screen.getByLabelText(/^Password$/i)
    confirmPasswordInput = screen.getByLabelText(/^Confirm Password$/i)
    submitButton = screen.getByRole('button', { name: /^Create Account$/i })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders fields and submit button', async () => {
    await expect.element(nameInput).toBeInTheDocument()
    await expect.element(emailInput).toBeInTheDocument()
    await expect.element(passwordInput).toBeInTheDocument()
    await expect.element(confirmPasswordInput).toBeInTheDocument()
    await expect.element(submitButton).toBeInTheDocument()
  })

  it('shows validation messages when submitting empty form', async () => {
    await userEvent.click(submitButton)

    await expect
      .element(screen.getByText(FORM_MESSAGES.nameEmpty))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText(FORM_MESSAGES.emailEmpty))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText(FORM_MESSAGES.passwordEmpty))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText(FORM_MESSAGES.confirmPasswordEmpty))
      .toBeInTheDocument()
    expect(postMock).not.toHaveBeenCalled()
  })

  it('shows a mismatch error when passwords do not match', async () => {
    await userEvent.fill(nameInput, 'Budi')
    await userEvent.fill(emailInput, 'a@b.com')
    await userEvent.fill(passwordInput, '1234567')
    await userEvent.fill(confirmPasswordInput, '7654321')

    await userEvent.click(submitButton)
    await expect
      .element(screen.getByText(FORM_MESSAGES.passwordMismatch))
      .toBeInTheDocument()
    expect(postMock).not.toHaveBeenCalled()
  })

  it('registers via the backend and redirects on success', async () => {
    await userEvent.fill(nameInput, 'Budi')
    await userEvent.fill(emailInput, 'a@b.com')
    await userEvent.fill(passwordInput, '1234567')
    await userEvent.fill(confirmPasswordInput, '1234567')

    await userEvent.click(submitButton)

    await vi.waitFor(() =>
      expect(postMock).toHaveBeenCalledWith('/auth/register', {
        name: 'Budi',
        email: 'a@b.com',
        password: '1234567',
      })
    )
    await vi.waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith({
        to: '/dashboard',
        replace: true,
      })
    )
  })
})
