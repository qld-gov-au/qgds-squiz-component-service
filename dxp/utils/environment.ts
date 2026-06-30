
export const getEnv = (info: { ctx?: { url?: string } }) => {
  const currentHost = info.ctx?.url || '';

  const domainPattern = (pattern: string) => 
    new RegExp(`^https?:\\/\\/${pattern}\\.[a-z0-9-]+\\.qld\\.gov\\.au`, 'i');

  //DEV
  if (currentHost === '') {
    return 'dev';
  }

  // UAT
  const isStagingService = /qldgovau\.staging-services\.qld\.gov\.au/i.test(currentHost);
  if ( isStagingService || domainPattern('uat').test(currentHost) ) {
    return 'uat';
  }

  // TEST
  const isTestService = /qldgovau\.test-services\.qld\.gov\.au/i.test(currentHost);
  if ( isTestService || domainPattern('dev').test(currentHost) ) {
    return 'test';
  }

  //PROD
  return 'prod';

};
