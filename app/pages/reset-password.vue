<template>
  <div class="reset-password">
    <NuxtLink to="/settings" class="button button-icon reset-password__back" :aria-label="$t('common.back')">
      <AppIcon name="arrow_back" size="1.25rem" />
    </NuxtLink>

    <div class="reset-password__content">
      <!-- Invalid / missing link -->
      <div v-if="!hasValidLink" class="reset-password__panel">
        <div class="reset-password__hero">
          <div class="reset-password__icon-wrap reset-password__icon-wrap--error">
            <AppIcon name="link_off" size="1.75rem" class="reset-password__icon reset-password__icon--error" />
          </div>
          <h1 class="reset-password__title">{{ $t('auth.resetPassword.invalidLinkTitle') }}</h1>
          <p class="reset-password__subtitle">{{ $t('auth.resetPassword.invalidLinkMessage') }}</p>
        </div>

        <NuxtLink to="/forgot-password" class="button button-primary reset-password__submit">
          {{ $t('auth.resetPassword.requestNewLink') }}
        </NuxtLink>
      </div>

      <!-- Valid link: form / success -->
      <Transition v-else name="auth-swap" mode="out-in">
        <div v-if="!submitted" key="form" class="reset-password__panel">
          <div class="reset-password__hero">
            <div class="reset-password__icon-wrap">
              <AppIcon name="lock_reset" size="1.75rem" class="reset-password__icon" />
            </div>
            <h1 class="reset-password__title">{{ $t('auth.resetPassword.title') }}</h1>
            <p class="reset-password__subtitle">{{ $t('auth.resetPassword.subtitle') }}</p>
          </div>

          <form class="reset-password__form" novalidate @submit.prevent="handleSubmit">
            <div class="form-group">
              <label for="new-password">{{ $t('auth.resetPassword.newPassword') }}</label>
              <div class="input-group">
                <input
                  id="new-password"
                  v-model="password"
                  type="password"
                  autocomplete="new-password"
                  :placeholder="$t('auth.resetPassword.newPasswordPlaceholder')"
                  :disabled="submitting"
                  :aria-invalid="passwordTooShort"
                  required
                >
              </div>
              <p v-if="passwordTooShort" class="reset-password__field-error" role="alert">
                {{ $t('auth.resetPassword.errorTooShort') }}
              </p>
            </div>

            <div class="form-group">
              <label for="confirm-password">{{ $t('auth.resetPassword.confirmPassword') }}</label>
              <div class="input-group">
                <input
                  id="confirm-password"
                  v-model="confirmPassword"
                  type="password"
                  autocomplete="new-password"
                  :placeholder="$t('auth.resetPassword.confirmPasswordPlaceholder')"
                  :disabled="submitting"
                  :aria-invalid="passwordsMismatch"
                  required
                >
              </div>
              <p v-if="passwordsMismatch" class="reset-password__field-error" role="alert">
                {{ $t('auth.resetPassword.errorMismatch') }}
              </p>
            </div>

            <div v-if="serverError" class="alert alert-error" role="alert">
              {{ serverError }}
            </div>

            <button
              type="submit"
              class="button button-primary reset-password__submit"
              :class="{ 'is-loading': submitting }"
              :disabled="submitting"
            >
              {{ $t('auth.resetPassword.submitButton') }}
            </button>
          </form>
        </div>

        <div v-else key="success" class="reset-password__panel">
          <div class="reset-password__hero">
            <div class="reset-password__icon-wrap reset-password__icon-wrap--success">
              <AppIcon name="check_circle" size="1.75rem" class="reset-password__icon reset-password__icon--success" />
            </div>
            <h1 class="reset-password__title">{{ $t('auth.resetPassword.successTitle') }}</h1>
            <p class="reset-password__subtitle">{{ $t('auth.resetPassword.successMessage') }}</p>
          </div>

          <NuxtLink to="/settings" class="button button-primary reset-password__submit">
            {{ $t('auth.resetPassword.continueButton') }}
          </NuxtLink>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const authStore = useAuthStore()
const { t } = useI18n()

const token = computed(() => {
  const v = route.query.token
  return typeof v === 'string' && v.length > 0 ? v : null
})
const email = computed(() => {
  const v = route.query.email
  return typeof v === 'string' && v.length > 0 ? v : null
})
const hasValidLink = computed(() => token.value !== null && email.value !== null)

const password = ref('')
const confirmPassword = ref('')
const submitting = ref(false)
const submitted = ref(false)
const serverError = ref<string | null>(null)

const passwordTooShort = computed(() => password.value.length > 0 && password.value.length < 8)
const passwordsMismatch = computed(() => confirmPassword.value.length > 0 && password.value !== confirmPassword.value)
const canSubmit = computed(() =>
  password.value.length >= 8 && password.value === confirmPassword.value && !submitting.value,
)

let redirectTimer: ReturnType<typeof setTimeout> | null = null

async function handleSubmit() {
  serverError.value = null
  if (!canSubmit.value || !token.value || !email.value) return

  submitting.value = true
  try {
    await authStore.confirmPasswordReset(token.value, email.value, password.value)
    submitted.value = true
    redirectTimer = setTimeout(() => navigateTo('/settings'), 4000)
  } catch (e) {
    const err = e as { status: number | null, message: string }
    serverError.value = err.status === null ? t('auth.offlineError') : (err.message || t('auth.genericError'))
  } finally {
    submitting.value = false
  }
}

onUnmounted(() => {
  if (redirectTimer) clearTimeout(redirectTimer)
})
</script>

<style lang="scss" scoped>
@use "@dodlhuat/basix/css/parameters" as *;
@use "~/assets/scss/variables" as *;

.reset-password {
  position: relative;
  max-width: $app-max-width;
  margin: 0 auto;
  padding: calc($spacing * 1.5) $spacing calc($spacing * 2);
  min-height: calc(100dvh - $header-height);
  display: flex;
  flex-direction: column;

  // Auth screens stay a single centered reading column even on wide
  // viewports — just a wider one. No grid/multi-column treatment; a
  // stretched-out form looks worse, not better.
  @media (min-width: $breakpoint-tablet) {
    max-width: 30rem;
  }

  &__back {
    align-self: flex-start;
    margin-bottom: calc($spacing * 0.75);
  }

  &__content {
    flex: 1;
    display: flex;
    align-items: center;
  }

  &__panel {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: calc($spacing * 1.5);
  }

  &__hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: calc($spacing * 0.6);
  }

  &__icon-wrap {
    width: 3.5rem;
    height: 3.5rem;
    border-radius: var(--radius-full);
    background: var(--accent-color-tint);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: auth-hero-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;

    &--success {
      background: var(--success-tint);
    }

    &--error {
      background: var(--error-tint);
    }
  }

  &__icon {
    color: var(--accent-color);

    &--success {
      color: var(--success);
    }

    &--error {
      color: var(--error);
    }
  }

  &__title {
    font-size: 1.4rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    margin: 0;
    animation: auth-fade-up 0.45s ease-out 0.08s both;
  }

  &__subtitle {
    font-size: 0.875rem;
    color: var(--secondary-text);
    line-height: 1.5;
    margin: 0;
    max-width: 26rem;
    animation: auth-fade-up 0.45s ease-out 0.14s both;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: calc($spacing * 0.85);
    animation: auth-fade-up 0.45s ease-out 0.2s both;
  }

  &__field-error {
    color: var(--error);
    font-size: 0.8rem;
    margin: 0.3rem 0 0;
  }

  &__submit {
    width: 100%;
    animation: auth-fade-up 0.45s ease-out 0.2s both;
  }
}

@keyframes auth-hero-pop {
  0% { transform: scale(0.4); opacity: 0; }
  60% { transform: scale(1.12); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes auth-fade-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

// ─── State swap transition ─────────────────────────────────────────
.auth-swap-enter-active {
  transition: opacity 0.28s ease, transform 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}

.auth-swap-leave-active {
  transition: opacity 0.18s ease, transform 0.2s ease;
}

.auth-swap-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.auth-swap-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (prefers-reduced-motion: reduce) {
  .reset-password__icon-wrap,
  .reset-password__title,
  .reset-password__subtitle,
  .reset-password__form,
  .reset-password__submit {
    animation: none;
  }

  .auth-swap-enter-active,
  .auth-swap-leave-active {
    transition: opacity 0.15s ease;
  }

  .auth-swap-enter-from,
  .auth-swap-leave-to {
    transform: none;
  }
}
</style>
