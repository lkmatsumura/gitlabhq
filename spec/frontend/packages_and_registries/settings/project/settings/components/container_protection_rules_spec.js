import { GlLoadingIcon, GlKeysetPagination } from '@gitlab/ui';
import Vue from 'vue';
import VueApollo from 'vue-apollo';
import { mountExtended, extendedWrapper } from 'helpers/vue_test_utils_helper';
import createMockApollo from 'helpers/mock_apollo_helper';
import waitForPromises from 'helpers/wait_for_promises';
import ContainerProtectionRules from '~/packages_and_registries/settings/project/components/container_protection_rules.vue';
import SettingsBlock from '~/packages_and_registries/shared/components/settings_block.vue';
import ContainerProtectionRuleQuery from '~/packages_and_registries/settings/project/graphql/queries/get_container_protection_rules.query.graphql';
import { containerProtectionRulesData, containerProtectionRuleQueryPayload } from '../mock_data';

Vue.use(VueApollo);

describe('Container protection rules project settings', () => {
  let wrapper;
  let fakeApollo;

  const defaultProvidedValues = {
    projectPath: 'path',
  };

  const $toast = { show: jest.fn() };

  const findSettingsBlock = () => wrapper.findComponent(SettingsBlock);
  const findTable = () => extendedWrapper(wrapper.findByRole('table', /protected Container/i));
  const findTableBody = () => extendedWrapper(findTable().findAllByRole('rowgroup').at(1));
  const findTableRow = (i) => extendedWrapper(findTableBody().findAllByRole('row').at(i));
  const findTableLoadingIcon = () => wrapper.findComponent(GlLoadingIcon);
  const findAlert = () => wrapper.findByRole('alert');

  const mountComponent = (mountFn = mountExtended, provide = defaultProvidedValues, config) => {
    wrapper = mountFn(ContainerProtectionRules, {
      stubs: {
        SettingsBlock,
        GlModal: true,
      },
      mocks: {
        $toast,
      },
      provide,
      ...config,
    });
  };

  const createComponent = ({
    mountFn = mountExtended,
    provide = defaultProvidedValues,
    containerProtectionRuleQueryResolver = jest
      .fn()
      .mockResolvedValue(containerProtectionRuleQueryPayload()),
    config = {},
  } = {}) => {
    const requestHandlers = [[ContainerProtectionRuleQuery, containerProtectionRuleQueryResolver]];

    fakeApollo = createMockApollo(requestHandlers);

    mountComponent(mountFn, provide, {
      apolloProvider: fakeApollo,
      ...config,
    });
  };

  it('renders the setting block with table', async () => {
    createComponent();

    await waitForPromises();

    expect(findSettingsBlock().exists()).toBe(true);
    expect(findTable().exists()).toBe(true);
  });

  describe('table "package protection rules"', () => {
    it('renders table with Container protection rules', async () => {
      createComponent();

      await waitForPromises();

      expect(findTable().exists()).toBe(true);

      containerProtectionRuleQueryPayload().data.project.containerRegistryProtectionRules.nodes.forEach(
        (protectionRule, i) => {
          expect(findTableRow(i).text()).toContain(protectionRule.repositoryPathPattern);
          expect(findTableRow(i).text()).toContain('Maintainer');
          expect(findTableRow(i).text()).toContain('Maintainer');
        },
      );
    });

    it('displays table in busy state and shows loading icon inside table', async () => {
      createComponent();

      expect(findTableLoadingIcon().exists()).toBe(true);
      expect(findTableLoadingIcon().attributes('aria-label')).toBe('Loading');

      expect(findTable().attributes('aria-busy')).toBe('true');

      await waitForPromises();

      expect(findTableLoadingIcon().exists()).toBe(false);
      expect(findTable().attributes('aria-busy')).toBe('false');
    });

    it('calls graphql api query', () => {
      const containerProtectionRuleQueryResolver = jest
        .fn()
        .mockResolvedValue(containerProtectionRuleQueryPayload());
      createComponent({ containerProtectionRuleQueryResolver });

      expect(containerProtectionRuleQueryResolver).toHaveBeenCalledWith(
        expect.objectContaining({ projectPath: defaultProvidedValues.projectPath }),
      );
    });

    it('shows alert when graphql api query failed', async () => {
      const graphqlErrorMessage = 'Error when requesting graphql api';
      const containerProtectionRuleQueryResolver = jest
        .fn()
        .mockRejectedValue(new Error(graphqlErrorMessage));
      createComponent({ containerProtectionRuleQueryResolver });

      await waitForPromises();

      expect(findAlert().isVisible()).toBe(true);
      expect(findAlert().text()).toBe(graphqlErrorMessage);
    });

    describe('table pagination', () => {
      const findPagination = () => wrapper.findComponent(GlKeysetPagination);

      it('renders pagination', async () => {
        createComponent();

        await waitForPromises();

        expect(findPagination().exists()).toBe(true);
        expect(findPagination().props()).toMatchObject({
          endCursor: '10',
          startCursor: '0',
          hasNextPage: true,
          hasPreviousPage: false,
        });
      });

      it('calls initial graphql api query with pagination information', () => {
        const containerProtectionRuleQueryResolver = jest
          .fn()
          .mockResolvedValue(containerProtectionRuleQueryPayload());
        createComponent({ containerProtectionRuleQueryResolver });

        expect(containerProtectionRuleQueryResolver).toHaveBeenCalledWith(
          expect.objectContaining({
            projectPath: defaultProvidedValues.projectPath,
            first: 10,
          }),
        );
      });

      it('show alert when grapqhl fails', () => {
        const containerProtectionRuleQueryResolver = jest
          .fn()
          .mockResolvedValue(containerProtectionRuleQueryPayload());
        createComponent({ containerProtectionRuleQueryResolver });

        expect(containerProtectionRuleQueryResolver).toHaveBeenCalledWith(
          expect.objectContaining({
            projectPath: defaultProvidedValues.projectPath,
            first: 10,
          }),
        );
      });

      describe('when button "Previous" is clicked', () => {
        const containerProtectionRuleQueryResolver = jest
          .fn()
          .mockResolvedValueOnce(
            containerProtectionRuleQueryPayload({
              nodes: containerProtectionRulesData.slice(10),
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: true,
                startCursor: '10',
                endCursor: '16',
              },
            }),
          )
          .mockResolvedValueOnce(containerProtectionRuleQueryPayload());

        const findPaginationButtonPrev = () =>
          extendedWrapper(findPagination()).findByRole('button', { name: 'Previous' });

        beforeEach(async () => {
          createComponent({ containerProtectionRuleQueryResolver });

          await waitForPromises();

          findPaginationButtonPrev().trigger('click');
        });

        it('sends a second graphql api query with new pagination params', () => {
          expect(containerProtectionRuleQueryResolver).toHaveBeenCalledTimes(2);
          expect(containerProtectionRuleQueryResolver).toHaveBeenLastCalledWith(
            expect.objectContaining({
              before: '10',
              last: 10,
              projectPath: 'path',
            }),
          );
        });
      });

      describe('when button "Next" is clicked', () => {
        const containerProtectionRuleQueryResolver = jest
          .fn()
          .mockResolvedValueOnce(containerProtectionRuleQueryPayload())
          .mockResolvedValueOnce(
            containerProtectionRuleQueryPayload({
              nodes: containerProtectionRulesData.slice(10),
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: false,
                startCursor: '1',
                endCursor: '10',
              },
            }),
          );

        const findPaginationButtonNext = () =>
          extendedWrapper(findPagination()).findByRole('button', { name: 'Next' });

        beforeEach(async () => {
          createComponent({ containerProtectionRuleQueryResolver });

          await waitForPromises();

          findPaginationButtonNext().trigger('click');
        });

        it('sends a second graphql api query with new pagination params', () => {
          expect(containerProtectionRuleQueryResolver).toHaveBeenCalledTimes(2);
          expect(containerProtectionRuleQueryResolver).toHaveBeenLastCalledWith(
            expect.objectContaining({
              after: '10',
              first: 10,
              projectPath: 'path',
            }),
          );
        });
      });
    });
  });

  describe('alert "errorMessage"', () => {
    const findAlertButtonDismiss = () => wrapper.findByRole('button', { name: /dismiss/i });

    it('renders alert and dismisses it correctly', async () => {
      const alertErrorMessage = 'Error message';
      createComponent({
        config: {
          data() {
            return {
              alertErrorMessage,
            };
          },
        },
      });

      await waitForPromises();

      expect(findAlert().isVisible()).toBe(true);
      expect(findAlert().text()).toBe(alertErrorMessage);

      await findAlertButtonDismiss().trigger('click');

      expect(findAlert().exists()).toBe(false);
    });
  });
});
