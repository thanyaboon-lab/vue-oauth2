<template>
  <div class="text-3xl font-bold underline" role="button" @click="returnToLogin()">
    Login with Google account
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

// const route = useRoute()

function returnToLogin(redirectUri?: string) {
  replaceHistoryStateToLogin(redirectUri)
}

function replaceHistoryStateToLogin(redirectUri?: string) {
  window.location.href = redirectUri ? `/api/login?redirectUri=${redirectUri}` : '/api/login'
}
</script>

<style scoped>

</style>