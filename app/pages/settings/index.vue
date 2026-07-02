<template>
  <div class="page-content settings">
    <h1>{{ $t('settings.title') }}</h1>

    <!-- Sektion 1: Account -->
    <div class="settings__group">
      <p class="settings__section-title">{{ $t('settings.account.title') }}</p>
      <div class="settings__section">
        <!-- Ausgeloggt: Login-Formular -->
        <template v-if="!authStore.isAuthenticated">
          <form class="settings__account-form" novalidate @submit.prevent="handleLogin">
            <p class="settings__account-intro">{{ $t('settings.account.loginIntro') }}</p>

            <div class="form-group">
              <label for="account-email">{{ $t('auth.email') }}</label>
              <div class="input-group">
                <input
                  id="account-email"
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
              <div class="settings__account-password-label">
                <label for="account-password">{{ $t('auth.password') }}</label>
                <NuxtLink to="/forgot-password" class="settings__account-forgot-link">
                  {{ $t('auth.forgotPassword.title') }}
                </NuxtLink>
              </div>
              <div class="input-group">
                <input
                  id="account-password"
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
              class="button button-primary settings__account-submit"
              :class="{ 'is-loading': loggingIn }"
              :disabled="loggingIn"
            >
              {{ $t('auth.loginButton') }}
            </button>
          </form>
        </template>

        <!-- Eingeloggt: Identität, Sync-Status, Logout -->
        <template v-else>
          <p class="settings__account-caption">{{ $t('settings.account.loggedInAs') }}</p>
          <div class="settings__row settings__row--identity">
            <div class="settings__row-left">
              <div class="settings__account-avatar" aria-hidden="true">{{ userInitials }}</div>
              <div class="settings__row-info">
                <span class="settings__row-label">{{ authStore.user?.name }}</span>
                <span class="settings__row-sub">{{ authStore.user?.email }}</span>
              </div>
            </div>
          </div>

          <div class="settings__section-divider" />

          <div class="settings__row settings__row--macro">
            <span class="settings__macro-name">{{ $t('settings.account.lastSynced') }}</span>
            <span class="settings__macro-value">{{ lastSyncedLabel }}</span>
          </div>

          <div class="settings__section-divider" />

          <button
            type="button"
            class="settings__row settings__row--action"
            :class="{ 'settings__row--disabled': syncStore.isSyncing }"
            :disabled="syncStore.isSyncing"
            :aria-busy="syncStore.isSyncing"
            @click="handleSyncNow"
          >
            <div class="settings__row-left">
              <AppIcon
                name="sync"
                size="1.25rem"
                class="settings__row-icon"
                :class="{ 'settings__row-icon--spinning': syncStore.isSyncing }"
              />
              <div class="settings__row-info">
                <span class="settings__row-label">{{ $t('settings.account.syncNow') }}</span>
                <span class="settings__row-sub">{{ syncNowSubtitle }}</span>
              </div>
            </div>
            <AppIcon v-if="!syncStore.isSyncing" name="chevron_right" size="1.25rem" class="settings__row-chevron" />
          </button>

          <template v-if="syncStore.syncError">
            <div class="settings__section-divider" />
            <div class="settings__account-sync-error">
              <div class="alert alert-error" role="alert">
                {{ syncStore.syncError }}
              </div>
            </div>
          </template>

          <div class="settings__section-divider" />

          <button
            type="button"
            class="settings__row settings__row--action settings__row--danger"
            :class="{ 'is-loading': loggingOut }"
            :disabled="loggingOut"
            @click="handleLogout"
          >
            <div class="settings__row-left">
              <AppIcon name="logout" size="1.25rem" class="settings__row-icon" />
              <span class="settings__row-label">{{ $t('settings.account.logoutButton') }}</span>
            </div>
          </button>
        </template>
      </div>
    </div>

    <!-- Sektion 2: Profil -->
    <div class="settings__group">
      <p class="settings__section-title">{{ $t('settings.profile') }}</p>
      <div class="settings__section">
        <NuxtLink to="/settings/profile" class="settings__row settings__row--link">
          <div class="settings__row-left">
            <AppIcon name="person" size="1.25rem" class="settings__row-icon" />
            <div class="settings__row-info">
              <span class="settings__row-label">{{ $t('settings.profileLabel') }}</span>
              <span v-if="user" class="settings__row-sub">{{ user.name }} · {{ user.calorie_goal }} kcal</span>
            </div>
          </div>
          <AppIcon name="chevron_right" size="1.25rem" class="settings__row-chevron" />
        </NuxtLink>

        <div class="settings__section-divider" />

        <div class="settings__row">
          <div class="settings__row-left">
            <AppIcon name="auto_graph" size="1.25rem" class="settings__row-icon" />
            <div class="settings__row-info">
              <span class="settings__row-label">{{ $t('settings.adaptiveCalories') }}</span>
              <span class="settings__row-sub">{{ $t('settings.adaptiveCaloriesSub') }}</span>
            </div>
          </div>
          <div class="switch">
            <input
              id="adaptive-calories-toggle"
              type="checkbox"
              :checked="user?.adaptive_calories_enabled ?? false"
              @change="userStore.updateSetting('adaptive_calories_enabled', ($event.target as HTMLInputElement).checked)"
            >
            <label for="adaptive-calories-toggle"/>
          </div>
        </div>

        <div v-if="user?.adaptive_calories_last_adjusted_at" class="settings__adaptive-hint">
          {{ $t('settings.lastAdjusted') }}: {{ formatDate(user.adaptive_calories_last_adjusted_at) }}
          <template v-if="user.adaptive_calories_last_delta_kcal">
            ({{ user.adaptive_calories_last_delta_kcal > 0 ? '+' : '' }}{{ user.adaptive_calories_last_delta_kcal }} kcal)
          </template>
        </div>
      </div>
    </div>

    <!-- Sektion 3: Tägliche Ziele -->
    <div class="settings__group">
      <p class="settings__section-title">{{ $t('settings.dailyGoals') }}</p>
      <div class="settings__section">
        <!-- Wasserziel -->
        <div class="settings__row">
          <div class="settings__row-left">
            <AppIcon name="water_drop" size="1.25rem" class="settings__row-icon settings__row-icon--water" />
            <div class="settings__row-info">
              <span class="settings__row-label">{{ $t('settings.waterGoal') }}</span>
              <span class="settings__row-sub">{{ $t('settings.waterGoalSub') }}</span>
            </div>
          </div>
          <input
            v-model.number="waterGoalInput"
            type="number"
            class="settings__water-input"
            min="500"
            max="5000"
            step="100"
            @change="saveWaterGoal"
            @blur="saveWaterGoal"
          >
        </div>
        <div class="settings__preset-chips">
          <button
            v-for="ml in waterPresets"
            :key="ml"
            type="button"
            class="chip clickable"
            :class="{ 'selected': waterGoalInput === ml }"
            @click="setWaterPreset(ml)"
          >
            {{ ml }}
          </button>
        </div>

        <div class="settings__section-divider" />

        <!-- Makroziele (read-only) -->
        <div class="settings__row settings__row--macro">
          <span class="settings__macro-name">{{ $t('common.protein') }}</span>
          <span class="settings__macro-value">{{ user?.protein_goal_g ?? '—' }} g</span>
        </div>
        <div class="settings__row settings__row--macro settings__row--bordered">
          <span class="settings__macro-name">{{ $t('common.carbs') }}</span>
          <span class="settings__macro-value">{{ user?.carbs_goal_g ?? '—' }} g</span>
        </div>
        <div class="settings__row settings__row--macro settings__row--bordered">
          <span class="settings__macro-name">{{ $t('common.fat') }}</span>
          <span class="settings__macro-value">{{ user?.fat_goal_g ?? '—' }} g</span>
        </div>
        <div class="settings__macro-hint">
          <NuxtLink to="/settings/profile" class="settings__macro-link">
            {{ $t('settings.adjustInProfile') }}
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Sektion 4: Darstellung -->
    <div class="settings__group">
      <p class="settings__section-title">{{ $t('settings.display') }}</p>
      <div class="settings__section">
        <!-- Dunkelmodus -->
        <div class="settings__row">
          <div class="settings__row-left">
            <AppIcon name="dark_mode" size="1.25rem" class="settings__row-icon" />
            <span class="settings__row-label">{{ $t('settings.darkMode') }}</span>
          </div>
          <div class="switch">
            <input id="dark-mode-toggle" type="checkbox" :checked="isDark" @change="toggleTheme" >
            <label for="dark-mode-toggle"/>
          </div>
        </div>

        <div class="settings__section-divider" />

        <!-- Einheiten -->
        <div class="settings__row settings__row--stacked">
          <div class="settings__row-left">
            <AppIcon name="straighten" size="1.25rem" class="settings__row-icon" />
            <div class="settings__row-info">
              <span class="settings__row-label">{{ $t('settings.units') }}</span>
              <span class="settings__row-sub">{{ $t('settings.unitsSub') }}</span>
            </div>
          </div>
          <div class="chips settings__unit-chips">
            <button
              type="button"
              class="chip clickable"
              :class="{ 'selected': user?.unit_system === 'metric' }"
              @click="userStore.updateSetting('unit_system', 'metric')"
            >
              {{ $t('settings.metric') }}
            </button>
            <button
              type="button"
              class="chip clickable"
              :class="{ 'selected': user?.unit_system === 'imperial' }"
              @click="userStore.updateSetting('unit_system', 'imperial')"
            >
              {{ $t('settings.imperial') }}
            </button>
          </div>
        </div>

        <div class="settings__section-divider" />

        <!-- Sprache / Language -->
        <div class="settings__row settings__row--stacked">
          <div class="settings__row-left">
            <AppIcon name="language" size="1.25rem" class="settings__row-icon" />
            <span class="settings__row-label">{{ $t('settings.language') }}</span>
          </div>
          <div class="chips settings__unit-chips">
            <button
              type="button"
              class="chip clickable"
              :class="{ 'selected': currentLocale === 'de' }"
              @click="changeLocale('de')"
            >
              DE
            </button>
            <button
              type="button"
              class="chip clickable"
              :class="{ 'selected': currentLocale === 'en' }"
              @click="changeLocale('en')"
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Sektion 5: Daten -->
    <div class="settings__group">
      <p class="settings__section-title">{{ $t('settings.data') }}</p>
      <div class="settings__section">
        <button type="button" class="settings__row settings__row--action" @click="exportJSON">
          <div class="settings__row-left">
            <AppIcon name="download" size="1.25rem" class="settings__row-icon" />
            <span class="settings__row-label">{{ $t('settings.exportJSON') }}</span>
          </div>
          <AppIcon name="chevron_right" size="1.25rem" class="settings__row-chevron" />
        </button>

        <div class="settings__section-divider" />

        <button type="button" class="settings__row settings__row--action" @click="exportCSV">
          <div class="settings__row-left">
            <AppIcon name="table_chart" size="1.25rem" class="settings__row-icon" />
            <span class="settings__row-label">{{ $t('settings.exportCSV') }}</span>
          </div>
          <AppIcon name="chevron_right" size="1.25rem" class="settings__row-chevron" />
        </button>

        <div class="settings__section-divider" />

        <button type="button" class="settings__row settings__row--action settings__row--danger" @click="showResetModal = true">
          <div class="settings__row-left">
            <AppIcon name="delete_forever" size="1.25rem" class="settings__row-icon" />
            <span class="settings__row-label">{{ $t('settings.deleteData') }}</span>
          </div>
          <AppIcon name="chevron_right" size="1.25rem" class="settings__row-chevron" />
        </button>
      </div>
    </div>

    <!-- Sektion 6: Über die App -->
    <div class="settings__group">
      <p class="settings__section-title">{{ $t('settings.about') }}</p>
      <div class="settings__section">
        <div class="settings__row">
          <div class="settings__row-left">
            <AppIcon name="info" size="1.25rem" class="settings__row-icon" />
            <div class="settings__row-info">
              <span class="settings__row-label">BasixMacro</span>
              <span class="settings__row-sub">Version 1.0.0</span>
            </div>
          </div>
        </div>
        <div class="settings__section-divider" />
        <div class="settings__row">
          <div class="settings__row-left">
            <AppIcon name="privacy_tip" size="1.25rem" class="settings__row-icon" />
            <span class="settings__row-label">{{ $t('settings.privacy') }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Reset-Bestätigungs-Modal -->
    <Teleport to="body">
      <Transition name="settings-modal">
        <div
          v-if="showResetModal"
          class="settings__modal-backdrop"
          @click.self="showResetModal = false"
        >
          <div class="settings__modal-card">
            <div class="settings__modal-icon-wrap">
              <AppIcon name="delete_forever" size="2rem" class="settings__modal-icon" />
            </div>
            <h2 class="settings__modal-title">{{ $t('settings.deleteModal.title') }}</h2>
            <p class="settings__modal-body">
              {{ $t('settings.deleteModal.body') }}
            </p>
            <div class="settings__modal-actions">
              <button
                type="button"
                class="button button-outline"
                :disabled="resetting"
                @click="showResetModal = false"
              >
                {{ $t('common.cancel') }}
              </button>
              <button
                type="button"
                class="button button-error"
                :class="{ 'is-loading': resetting }"
                :disabled="resetting"
                @click="confirmReset"
              >
                {{ $t('settings.deleteModal.confirm') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ title: 'Settings' })

const userStore = useUserStore()
const { user } = storeToRefs(userStore)
const authStore = useAuthStore()
const syncStore = useSyncStore()
const { isDark, toggleTheme } = useTheme()
const { exportJSON, exportCSV } = useDataExport()
const { locale: currentLocale, setLocale, t } = useI18n()

const waterPresets = [1500, 2000, 2500, 3000]
const waterGoalInput = ref(userStore.user?.water_goal_ml ?? 2000)
const showResetModal = ref(false)
const resetting = ref(false)

// ─── Account / Login ────────────────────────────────────────────────
const loginEmail = ref('')
const loginPassword = ref('')
const loginError = ref<string | null>(null)
const loggingIn = ref(false)
const loggingOut = ref(false)

const userInitials = computed(() => {
  const name = authStore.user?.name?.trim() ?? ''
  if (!name) return '?'
  const parts = name.split(/\s+/)
  const first = parts[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1] ?? '') : ''
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
})

const lastSyncedLabel = computed(() => {
  return syncStore.lastSyncedAt ? formatDate(syncStore.lastSyncedAt) : '—'
})

const syncNowSubtitle = computed(() => {
  if (syncStore.isSyncing) return t('settings.account.syncingNow')
  if (syncStore.pendingCount > 0) return t('settings.account.pendingChanges', { count: syncStore.pendingCount })
  return t('settings.account.syncNowHint')
})

async function handleSyncNow() {
  await syncStore.syncNow()
}

async function handleLogin() {
  loginError.value = null
  loggingIn.value = true
  try {
    await authStore.login(loginEmail.value, loginPassword.value)
    loginPassword.value = ''
  } catch (error) {
    const err = error as { status: number | null, message: string }
    loginError.value = err.status === null ? t('auth.offlineError') : (err.message || t('auth.loginError'))
  } finally {
    loggingIn.value = false
  }
}

async function handleLogout() {
  loggingOut.value = true
  await authStore.logout()
  loggingOut.value = false
}

watch(() => userStore.user?.water_goal_ml, (v) => {
  if (v) waterGoalInput.value = v
})

async function saveWaterGoal() {
  const val = Number(waterGoalInput.value)
  if (val >= 500 && val <= 5000) {
    await userStore.updateSetting('water_goal_ml', val)
  }
}

async function setWaterPreset(ml: number) {
  waterGoalInput.value = ml
  await userStore.updateSetting('water_goal_ml', ml)
}

function formatDate(iso: string): string {
  const loc = currentLocale.value === 'en' ? 'en-US' : 'de-DE'
  return new Date(iso).toLocaleDateString(loc, { day: '2-digit', month: '2-digit', year: 'numeric' })
}

async function changeLocale(lang: 'de' | 'en') {
  await setLocale(lang)
  await userStore.updateLocale(lang)
}

async function confirmReset() {
  resetting.value = true
  await userStore.resetAllData()
  navigateTo('/onboarding')
}

onMounted(() => userStore.loadUser())
</script>

<style lang="scss" scoped>
@use "@dodlhuat/basix/css/parameters" as *;

// ─── Page layout ──────────────────────────────────────────────────
.settings {
  padding-bottom: calc($spacing * 3);

  h1 {
    margin-bottom: $spacing;
    animation: settings-slide-in 0.4s ease-out both;
  }
}

// ─── Group (label + card) ─────────────────────────────────────────
.settings__group {
  display: flex;
  flex-direction: column;
  margin-bottom: calc($spacing * 1.25);
  animation: settings-slide-in 0.45s ease-out both;

  &:nth-child(2) { animation-delay: 0.04s; }
  &:nth-child(3) { animation-delay: 0.09s; }
  &:nth-child(4) { animation-delay: 0.14s; }
  &:nth-child(5) { animation-delay: 0.19s; }
  &:nth-child(6) { animation-delay: 0.24s; }
  &:nth-child(7) { animation-delay: 0.29s; }
}

// ─── Section title (above card) ───────────────────────────────────
.settings__section-title {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--secondary-text);
  padding: 0 calc($spacing * 0.25);
  margin: 0 0 0.4rem;
}

// ─── Section card ─────────────────────────────────────────────────
.settings__section {
  background: var(--secondary-background);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

// ─── Generic row ──────────────────────────────────────────────────
.settings__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: calc($spacing * 0.875) $spacing;
  min-height: 3.25rem;
  color: var(--primary-text);
  text-decoration: none;
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
  font-family: inherit;
  font-size: inherit;
  cursor: default;

  // Link / action rows: tap feedback
  &--link,
  &--action {
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: background 0.15s ease;

    &:active {
      background: var(--hover);
    }
  }

  // Bordered top divider (between macro rows)
  &--bordered {
    border-top: 1px solid var(--divider);
  }

  // Danger row
  &--danger {
    color: var(--error);

    .settings__row-icon {
      color: var(--error);
    }
  }

  // Stacked layout: label above chips
  &--stacked {
    flex-direction: column;
    align-items: flex-start;
    gap: calc($spacing * 0.6);
    padding-bottom: calc($spacing * 0.875);
  }

  // Macro rows: tighter padding
  &--macro {
    padding: calc($spacing * 0.65) $spacing;
  }

  // Identity row (account avatar + name/email): no tap feedback
  &--identity {
    cursor: default;
  }

  // Disabled action row (sync-now placeholder): dimmed, no tap feedback
  &--disabled {
    cursor: not-allowed;
    opacity: 0.6;

    &:active {
      background: transparent;
    }
  }
}

// ─── Row internals ────────────────────────────────────────────────
.settings__row-left {
  display: flex;
  align-items: center;
  gap: calc($spacing * 0.7);
  flex: 1;
  min-width: 0;
}

.settings__row-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.settings__row-label {
  font-size: 0.925rem;
  font-weight: 500;
  color: var(--primary-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.settings__row-sub {
  font-size: 0.78rem;
  color: var(--secondary-text);
  line-height: 1.3;
}

.settings__row-icon {
  color: var(--secondary-text);
  flex-shrink: 0;

  &--water {
    color: #5ba8f5;
  }
}

.settings__row-chevron {
  color: var(--secondary-text);
  flex-shrink: 0;
  opacity: 0.6;
}

// ─── Section divider ──────────────────────────────────────────────
.settings__section-divider {
  height: 1px;
  background: var(--divider);
  margin: 0 $spacing;
}

// ─── Water goal input ─────────────────────────────────────────────
.settings__water-input {
  width: 5.25rem;
  text-align: right;
  font-size: 1rem;
  font-weight: 600;
  font-family: inherit;
  color: var(--primary-text);
  background: var(--background);
  border: 1.5px solid var(--divider);
  border-radius: var(--radius-md);
  padding: 0.3rem 0.5rem;
  // Override Basix default box-shadow on inputs
  box-shadow: none;
  transition: border-color 0.18s ease;
  flex-shrink: 0;

  &:focus {
    outline: none;
    border-color: var(--accent-color);
    box-shadow: 0 0 0 3px var(--accent-color-tint);
  }

  // Hide number input spinners
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    appearance: none;
    margin: 0;
  }

  &[type='number'] {
    appearance: textfield;
    -moz-appearance: textfield;
  }
}

// ─── Preset water chips ───────────────────────────────────────────
.settings__preset-chips {
  display: flex;
  gap: calc($spacing * 0.375);
  padding: 0 $spacing calc($spacing * 0.875);
}

// ─── Macro info rows ──────────────────────────────────────────────
.settings__macro-name {
  font-size: 0.875rem;
  color: var(--primary-text);
}

.settings__macro-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--secondary-text);
}

.settings__macro-hint {
  padding: calc($spacing * 0.5) $spacing calc($spacing * 0.75);
}

.settings__macro-link {
  font-size: 0.8rem;
  color: var(--accent-color);
  text-decoration: none;
  font-weight: 500;

  &:active {
    opacity: 0.7;
  }
}

// ─── Unit chips ───────────────────────────────────────────────────
.settings__unit-chips {
  display: flex;
  gap: calc($spacing * 0.375);
  margin-left: calc(1.25rem + 0.7 * $spacing); // align with label (icon + gap)
}

// ─── Adaptive hint ────────────────────────────────────────────────
.settings__adaptive-hint {
  font-size: 0.75rem;
  color: var(--secondary-text);
  padding: 0 $spacing calc($spacing * 0.75);
}

// ─── Account section ──────────────────────────────────────────────
.settings__account-form {
  display: flex;
  flex-direction: column;
  gap: calc($spacing * 0.85);
  padding: $spacing;
}

.settings__account-intro {
  font-size: 0.8rem;
  color: var(--secondary-text);
  line-height: 1.45;
  margin: 0;
}

.settings__account-submit {
  width: 100%;
  margin-top: calc($spacing * 0.15);
}

.settings__account-password-label {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: calc($spacing * 0.5);

  label {
    margin: 0;
  }
}

.settings__account-forgot-link {
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--accent-color);
  text-decoration: none;
  white-space: nowrap;

  &:active {
    opacity: 0.7;
  }
}

.settings__account-caption {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--secondary-text);
  padding: calc($spacing * 0.875) $spacing 0;
  margin: 0;
}

.settings__account-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--radius-full);
  background: var(--accent-color-tint);
  color: var(--accent-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  flex-shrink: 0;
}

.settings__account-sync-error {
  padding: calc($spacing * 0.625) $spacing calc($spacing * 0.875);

  .alert {
    margin: 0;
  }
}

// Spin the sync icon while a sync round-trip is in flight
.settings__row-icon--spinning {
  animation: settings-sync-spin 0.9s linear infinite;
}

@keyframes settings-sync-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// ─── Reset modal ──────────────────────────────────────────────────
.settings__modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing;
}

.settings__modal-card {
  background: var(--secondary-background);
  border-radius: var(--radius-xl);
  padding: calc($spacing * 1.5);
  width: 100%;
  max-width: 22rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc($spacing * 0.75);
  text-align: center;
}

.settings__modal-icon-wrap {
  width: 3.25rem;
  height: 3.25rem;
  border-radius: var(--radius-full);
  background: var(--error-tint);
  display: flex;
  align-items: center;
  justify-content: center;
}

.settings__modal-icon {
  color: var(--error);
}

.settings__modal-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
  color: var(--primary-text);
}

.settings__modal-body {
  font-size: 0.875rem;
  color: var(--secondary-text);
  line-height: 1.5;
  margin: 0;
}

.settings__modal-actions {
  display: flex;
  gap: calc($spacing * 0.625);
  width: 100%;
  margin-top: calc($spacing * 0.25);

  .button {
    flex: 1;
  }
}

// ─── Modal transition ─────────────────────────────────────────────
.settings-modal-enter-active {
  transition: opacity 0.25s ease;

  .settings__modal-card {
    transition: transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease;
  }
}

.settings-modal-leave-active {
  transition: opacity 0.2s ease;

  .settings__modal-card {
    transition: transform 0.2s ease, opacity 0.2s ease;
  }
}

.settings-modal-enter-from,
.settings-modal-leave-to {
  opacity: 0;

  .settings__modal-card {
    transform: scale(0.9);
    opacity: 0;
  }
}

// ─── Entrance animation ───────────────────────────────────────────
@keyframes settings-slide-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .settings h1,
  .settings__group {
    animation: none;
  }

  .settings__row-icon--spinning {
    animation: none;
    opacity: 0.5;
  }

  .settings-modal-enter-active,
  .settings-modal-leave-active {
    transition: opacity 0.15s ease;

    .settings__modal-card {
      transition: opacity 0.15s ease;
    }
  }

  .settings-modal-enter-from .settings__modal-card,
  .settings-modal-leave-to .settings__modal-card {
    transform: none;
  }
}
</style>
