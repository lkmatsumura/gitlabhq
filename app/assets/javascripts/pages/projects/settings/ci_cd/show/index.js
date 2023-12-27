import initArtifactsSettings from '~/artifacts_settings';
import initSettingsPipelinesTriggers from '~/ci_settings_pipeline_triggers';
import initVariableList from '~/ci/ci_variable_list';
import initInheritedGroupCiVariables from '~/ci/inherited_ci_variables';
import initDeployFreeze from '~/deploy_freeze';
import registrySettingsApp from '~/packages_and_registries/settings/project/registry_settings_bundle';
import initSharedRunnersToggle from '~/projects/settings/mount_shared_runners_toggle';
import initRefSwitcherBadges from '~/projects/settings/mount_ref_switcher_badges';
import initSettingsPanels from '~/settings_panels';
import { initTokenAccess } from '~/token_access';
import { initCiSecureFiles } from '~/ci_secure_files';
import initDeployTokens from '~/deploy_tokens';
import { initProjectRunnersRegistrationDropdown } from '~/ci/runner/project_runners/register';
import { initGeneralPipelinesOptions } from '~/ci_settings_general_pipeline';

// Initialize expandable settings panels
initSettingsPanels();

initVariableList();
initInheritedGroupCiVariables();

// hide extra auto devops settings based checkbox state
const autoDevOpsExtraSettings = document.querySelector('.js-extra-settings');
const instanceDefaultBadge = document.querySelector('.js-instance-default-badge');
document.querySelector('.js-toggle-extra-settings').addEventListener('click', (event) => {
  const { target } = event;
  if (instanceDefaultBadge) instanceDefaultBadge.style.display = 'none';
  autoDevOpsExtraSettings.classList.toggle('hidden', !target.checked);
});

registrySettingsApp();
initDeployTokens();
initDeployFreeze();
initSettingsPipelinesTriggers();
initArtifactsSettings();

initProjectRunnersRegistrationDropdown();
initSharedRunnersToggle();
initRefSwitcherBadges();
initTokenAccess();
initCiSecureFiles();
initGeneralPipelinesOptions();
