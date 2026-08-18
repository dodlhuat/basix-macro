<template>
  <div class="login">
    <NuxtLink to="/onboarding" class="button button-icon login__back" :aria-label="$t('common.back')">
      <AppIcon name="arrow_back" size="1.25rem" />
    </NuxtLink>

    <div class="login__content">
      <div class="login__panel">
        <div class="login__hero">
          <div class="login__icon-wrap">
            <AppIcon name="login" size="1.75rem" class="login__icon" />
          </div>
          <h1 class="login__title">{{ $t('auth.login.title') }}</h1>
          <p class="login__subtitle">{{ $t('auth.login.subtitle') }}</p>
        </div>

        <form class="login__form" novalidate @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="login-email">{{ $t('auth.email') }}</label>
            <div class="input-group">
              <input
                id="login-email"
                v-model.trim="loginEmail"
                type="email"
                autocomplete="email"
                inputmode="email"
                :placeholder="$t('auth.emailPlaceholder')"
                :disabled="loggingIn"
                required
              >
            </div>
          </div>

          <div class="form-group">
            <div class="login__password-label">
              <label for="login-password">{{ $t('auth.password') }}</label>
              <NuxtLink to="/forgot-password" class="login__forgot-link">
                {{ $t('auth.forgotPassword.title') }}
              </NuxtLink>
            </div>
            <div class="input-group">
              <input
                id="login-password"
                v-model="loginPassword"
                type="password"
                autocomplete="current-password"
                :placeholder="$t('auth.passwordPlaceholder')"
                :disabled="loggingIn"
                required
              >
            </div>
          </div>

          <div v-if="loginError" class="alert alert-error" role="alert">
            {{ loginError }}
          </div>

          <button
            type="submit"
            class="button button-primary login__submit"
            :class="{ 'is-loading': loggingIn }"
            :disabled="loggingIn"
          >
            {{ $t('auth.loginButton') }}
          </button>

          <Transition name="login-hint">
            <p v-if="loggingIn" class="login__sync-hint">
              <AppIcon name="cloud_sync" size="1rem" class="login__sync-hint-icon" />
              {{ $t('settings.account.syncingNow') }}
            </p>
          </Transition>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const authStore = useAuthStore()
const userStore = useUserStore()
const { t } = useI18n()

const loginEmail = ref('')
const loginPassword = ref('')
const loginError = ref<string | null>(null)
const loggingIn = ref(false)

onMounted(() => {
  if (authStore.isAuthenticated && userStore.isOnboarded) {
    navigateTo('/')
  }
})

async function handleLogin() {
  loginError.value = null
  loggingIn.value = true
  try {
    await authStore.login(loginEmail.value, loginPassword.value, { awaitSync: true })
    await navigateTo(userStore.isOnboarded ? '/' : '/onboarding')
  } catch (error) {
    const err = error as { status: number | null, message: string }
    loginError.value = err.status === null ? t('auth.offlineError') : (err.message || t('auth.loginError'))
  } finally {
    loggingIn.value = false
  }
}
</script>

<style lang="scss" scoped>
@use "@dodlhuat/basix/css/parameters" as *;
@use "~/assets/scss/variables" as *;

.login {
  position: relative;
  max-width: $app-max-width;
  margin: 0 auto;
  padding: calc($spacing * 1.5) $spacing calc($spacing * 2);
  min-height: calc(100dvh - $header-height);
  display: flex;
  flex-direction: column;

  // Auth screens stay a single centered reading column even on wide
  // viewports — just a wider one, matching forgot-password/onboarding.
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
  }

  &__icon {
    color: var(--accent-color);
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

  &__password-label {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: calc($spacing * 0.5);
  }

  &__forgot-link {
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--accent-color);
    text-decoration: none;
    white-space: nowrap;

    &:active {
      opacity: 0.7;
    }
  }

  &__submit {
    width: 100%;
  }

  &__sync-hint {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: calc($spacing * 0.4);
    margin: 0;
    font-size: 0.8rem;
    color: var(--secondary-text);
  }

  &__sync-hint-icon {
    color: var(--accent-color);
    animation: login-sync-spin 1.1s linear infinite;
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

@keyframes login-sync-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// ─── Sync-hint reveal ───────────────────────────────────────────────
.login-hint-enter-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.login-hint-leave-active {
  transition: opacity 0.15s ease;
}

.login-hint-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}

.login-hint-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .login__icon-wrap,
  .login__title,
  .login__subtitle,
  .login__form {
    animation: none;
  }

  .login__sync-hint-icon {
    animation: none;
  }

  .login-hint-enter-active,
  .login-hint-leave-active {
    transition: opacity 0.15s ease;
  }

  .login-hint-enter-from,
  .login-hint-leave-to {
    transform: none;
  }
}
</style>
