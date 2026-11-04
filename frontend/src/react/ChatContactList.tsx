import React from 'react';
import { getPortraitUrl } from '../shared/agentRegistry';
import { t } from '../shared/i18n';

export interface ContactItem {
  slug: string;       // 'group' for group chat, agent slug for direct
  name: string;
  color: string;
  role?: string;
  lastMessage?: string;
  lastTime?: Date;
}

interface ChatContactListProps {
  contacts: ContactItem[];
  activeContact: string;
  onSelectContact: (slug: string) => void;
}

export const ChatContactList: React.FC<ChatContactListProps> = ({
  contacts,
  activeContact,
  onSelectContact,
}) => {
  return (
    <div style={styles.container}>
      <div style={styles.header}>{t('agent.list')}</div>
      <div style={styles.list}>
        {contacts.map((c) => {
          const isActive = c.slug === activeContact;
          const portrait = c.slug !== 'group' ? getPortraitUrl(c.slug) : null;
          return (
            <div
              key={c.slug}
              onClick={() => onSelectContact(c.slug)}
              style={{
                ...styles.item,
                ...(isActive ? styles.itemActive : {}),
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'rgba(236,72,153,0.08)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              {portrait ? (
                <img
                  src={portrait}
                  alt={c.name}
                  style={{
                    ...styles.avatarImg,
                    borderColor: c.color,
                  }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div style={{ ...styles.avatar, background: c.color }}>
                  {c.slug === 'group' ? 'P8' : c.name.charAt(0)}
                </div>
              )}

              <div style={styles.info}>
                <div style={styles.nameRow}>
                  <span style={{ ...styles.name, color: isActive ? '#f9a8d4' : '#e8e8ea' }}>
                    {c.name}
                  </span>
                </div>
                {c.lastMessage ? (
                  <div style={styles.preview}>{c.lastMessage}</div>
                ) : c.role ? (
                  <div style={styles.role}>{c.role}</div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: 168,
    flexShrink: 0,
    borderRight: '1px solid #2a2a30',
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(8, 8, 12, 0.88)',
    overflow: 'hidden',
  },
  header: {
    padding: '10px 12px',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ec4899',
    borderBottom: '1px solid #2a2a30',
    flexShrink: 0,
    letterSpacing: 0.4,
  },
  list: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '4px 0',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 10px',
    cursor: 'pointer',
    transition: 'background 0.1s',
    borderLeft: '3px solid transparent',
  },
  itemActive: {
    background: 'rgba(236, 72, 153, 0.12)',
    borderLeftColor: '#ec4899',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#111',
    flexShrink: 0,
  },
  avatarImg: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    objectFit: 'cover' as const,
    border: '2px solid #ec4899',
    flexShrink: 0,
    background: '#111',
  },
  info: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 13,
    fontWeight: 'bold',
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const,
  },
  role: {
    fontSize: 10,
    color: '#777',
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const,
    marginTop: 2,
  },
  preview: {
    fontSize: 11,
    color: '#888',
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const,
    marginTop: 2,
  },
};
