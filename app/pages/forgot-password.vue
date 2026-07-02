<template>
  <div class="forgot-password">
    <NuxtLink to="/settings" class="button button-icon forgot-password__back" :aria-label="$t('common.back')">
      <AppIcon name="arrow_back" size="1.25rem" />
    </NuxtLink>

    <div class="forgot-password__content">
      <Transition name="auth-swap" mode="out-in">
        <div v-if="!submitted" key="form" class="forgot-password__panel">
          <div class="forgot-password__hero">
            <div class="forgot-password__icon-wrap">
              <AppIcon name="lock_reset" size="1.75rem" class="forgot-password__icon" />
            </div>
            <h1 class="forgot-password__title">{{ $t('auth.forgotPassword.title') }}</h1>
            <p class="forgot-password__subtitle">{{ $t('auth.forgotPassword.subtitle') }}</p>
          </div>

          <form class="forgot-password__form" novalidate @submit.prevent="handleSubmit">
            <div class="form-group">
              <label for="forgot-email">{{ $t('auth.email') }}</label>
              <div class="input-group">
                <input
                  id="forgot-email"
                  v-model.trim="email"
                  type="email"
                  autocomplete="email"
                  inputmode="email"
                  :placeholder="$t('auth.emailPlaceholder')"
                  :disabled="submitting"
                  required
                >
              </div>
            </div>

            <div v-if="error" class="alert alert-error" role="alert">
              {{ error }}
            </div>

            <button
              type="submit"
              class="button button-primary forgot-password__submit"
              :class="{ 'is-loading': submitting }"
              :disabled="submitting"
            >
              {{ $t('auth.forgotPassword.submitButton') }}
            </button>
          </form>

          <NuxtLink to="/settings" class="forgot-password__footer-link">
            {{ $t('auth.forgotPassword.backToLogin') }}
          </NuxtLink>
        </div>

        <div v-else key="success" class="forgot-password__panel">
          <div class="forgot-password__hero">
            <div class="forgot-password__icon-wrap forgot-password__icon-wrap--success">
              <AppIcon name="mark_email_read" size="1.75rem" class="forgot-password__icon forgot-password__icon--success" />
            </div>
            <h1 class="forgot-password__title">{{ $t('auth.forgotPassword.successTitle') }}</h1>
            <p class="forgot-password__subtitle">{{ $t('auth.forgotPassword.successMessage') }}</p>
          </div>

          <button type="button" class="button button-outline forgot-password__submit" @click="resetForm">
            {{ $t('auth.forgotPassword.tryAnotherEmail') }}
          </button>

          <NuxtLink to="/settings" class="forgot-password__footer-link">
            {{ $t('auth.forgotPassword.backToLogin') }}
          </NuxtLink>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const authStore = useAuthStore()
const { t } = useI18n()

const email = ref('')
const submitting = ref(false)
const submitted = ref(false)
const error = ref<string | null>(null)

async function handleSubmit() {
  error.value = null
  submitting.value = true
  try {
    await authStore.requestPasswordReset(email.value)
    submitted.value = true
  } catch (e) {
    const err = e as { status: number | null, message: string }
    error.value = err.status === null ? t('auth.offlineError') : t('auth.genericError')
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  submitted.value = false
  email.value = ''
  error.value = null
}
</script>

<style lang="scss" scoped>
@use "@dodlhuat/basix/css/parameters" as *;
@use "~/assets/scss/variables" as *;

.forgot-password {
  position: relative;
  max-width: $app-max-width;
  margin: 0 auto;
  padding: calc($spacing * 1.5) $spacing calc($spacing * 2);
  min-height: calc(100dvh - $header-height);
  display: flex;
  flex-direction: column;

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
  }

  &__icon {
    color: var(--accent-color);

    &--success {
      color: var(--success);
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

  &__submit {
    width: 100%;
    animation: auth-fade-up 0.45s ease-out 0.2s both;
  }

  &__footer-link {
    align-self: center;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--accent-color);
    text-decoration: none;
    animation: auth-fade-up 0.45s ease-out 0.26s both;

    &:active {
      opacity: 0.7;
    }
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
  .forgot-password__icon-wrap,
  .forgot-password__title,
  .forgot-password__subtitle,
  .forgot-password__form,
  .forgot-password__submit,
  .forgot-password__footer-link {
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
