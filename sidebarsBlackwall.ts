import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  blackwallSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Hosts',
      link: {
        type: 'doc',
        id: 'hosts/index',
      },
      items: [
        'hosts/cynosure',
        'hosts/izanagi',
      ],
    },
    {
      type: 'category',
      label: 'Architecture',
      link: {
        type: 'doc',
        id: 'architecture/index',
      },
      items: [
        'architecture/topology',
        'architecture/nixos',
        'architecture/security',
        'architecture/networking',
        'architecture/maintenance',
        'architecture/monitoring',
      ],
    },
    {
      type: 'category',
      label: 'Storage',
      link: {
        type: 'doc',
        id: 'storage/index',
      },
      items: [
        'storage/drives',
        'storage/raid',
      ],
    },
    {
      type: 'category',
      label: 'Services',
      link: {
        type: 'doc',
        id: 'services/index',
      },
      items: [
        'services/archive',
      ],
    },
    {
      type: 'category',
      label: 'Hardware',
      link: {
        type: 'doc',
        id: 'hardware/index',
      },
      items: [
        'hardware/rack',
        'hardware/hosts',
        'hardware/networking',
      ],
    },
    'notes',
  ],
};

export default sidebars;
