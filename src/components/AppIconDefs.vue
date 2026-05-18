<template>
  <svg style="display:none" aria-hidden="true">
    <defs>

      <symbol id="icon-arrow-left" viewBox="0 0 24 24" fill="none">
        <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </symbol>

      <symbol id="icon-clock" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <polyline points="12 6 12 12 16 14" stroke="currentColor" stroke-width="2"/>
      </symbol>

      <symbol id="icon-dartboard" viewBox="0 0 24 24" fill="none">
        <path d="M19.2 12C19.2 8.02499 15.975 4.79999 12 4.79999C8.02499 4.79999 4.79999 8.02499 4.79999 12C4.79999 15.975 8.02499 19.2 12 19.2C15.975 19.2 19.2 15.975 19.2 12ZM2.39999 12C2.39999 6.69749 6.69749 2.39999 12 2.39999C17.3025 2.39999 21.6 6.69749 21.6 12C21.6 17.3025 17.3025 21.6 12 21.6C6.69749 21.6 2.39999 17.3025 2.39999 12ZM12 15C13.6575 15 15 13.6575 15 12C15 10.3425 13.6575 8.99999 12 8.99999C10.3425 8.99999 8.99999 10.3425 8.99999 12C8.99999 13.6575 10.3425 15 12 15ZM12 6.59999C14.9812 6.59999 17.4 9.01874 17.4 12C17.4 14.9812 14.9812 17.4 12 17.4C9.01874 17.4 6.59999 14.9812 6.59999 12C6.59999 9.01874 9.01874 6.59999 12 6.59999ZM10.8 12C10.8 11.3362 11.3362 10.8 12 10.8C12.6637 10.8 13.2 11.3362 13.2 12C13.2 12.6637 12.6637 13.2 12 13.2C11.3362 13.2 10.8 12.6637 10.8 12Z" fill="currentColor"/>
      </symbol>

      <symbol id="icon-exit" viewBox="0 0 24 24" fill="none">
        <path d="M19 12H12M15 9L12 12L15 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M19 6V5C19 3.89543 18.1046 3 17 3H7C5.89543 3 5 3.89543 5 5V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </symbol>

      <symbol id="icon-gear" viewBox="0 0 24 24" fill="none">
        <path d="M9.71622 2.75625C9.82872 2.20125 10.32 1.8 10.89 1.8H13.1325C13.7025 1.8 14.1937 2.20125 14.3062 2.75625L14.85 5.38125C15.3787 5.60625 15.8737 5.895 16.3237 6.23625L18.8662 5.3925C19.4062 5.2125 19.9987 5.4375 20.2837 5.9325L21.405 7.875C21.69 8.37 21.5887 8.9925 21.1612 9.37125L19.1625 11.1487C19.1962 11.4262 19.2112 11.7112 19.2112 12C19.2112 12.2887 19.1925 12.5737 19.1625 12.8512L21.165 14.6325C21.5925 15.0112 21.69 15.6375 21.4087 16.1287L20.2875 18.0712C20.0025 18.5625 19.41 18.7912 18.87 18.6112L16.3275 17.7675C15.8737 18.1087 15.3787 18.3937 14.8537 18.6225L14.3137 21.2437C14.1975 21.8025 13.7062 22.2 13.14 22.2H10.8975C10.3275 22.2 9.83622 21.7987 9.72372 21.2437L9.18372 18.6225C8.65497 18.3975 8.16372 18.1087 7.70997 17.7675L5.15622 18.6112C4.61622 18.7912 4.02372 18.5662 3.73872 18.0712L2.61747 16.1287C2.33247 15.6337 2.43372 15.0112 2.86122 14.6325L4.86372 12.8512C4.82997 12.5737 4.81497 12.2887 4.81497 12C4.81497 11.7112 4.83372 11.4262 4.86372 11.1487L2.86122 9.3675C2.43372 8.98875 2.33622 8.3625 2.61747 7.87125L3.73872 5.92875C4.02372 5.43375 4.61622 5.20875 5.15622 5.38875L7.69872 6.2325C8.15247 5.89125 8.64747 5.60625 9.17247 5.3775L9.71622 2.75625ZM12.0112 15C13.6687 14.9925 15.0075 13.6462 15 11.9887C14.9925 10.3312 13.6462 8.9925 11.9887 9C10.3312 9.0075 8.99247 10.3537 8.99997 12.0112C9.00747 13.6687 10.3537 15.0075 12.0112 15Z" fill="currentColor"/>
      </symbol>

      <symbol id="icon-undo" viewBox="0 0 24 24" fill="none">
        <path d="M9 14 4 9l5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </symbol>

      <symbol id="icon-stop" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </symbol>

    </defs>
  </svg>
</template>
