'use client';

import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  Switch, 
  Modal, 
  Form, 
  Input, 
  ColorPicker, 
  InputNumber,
  message,
  Popconfirm,
  Tooltip,
  Card
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  SettingOutlined,
  BugOutlined 
} from '@ant-design/icons';
import { getOAuthProviders, toggleOAuthProvider, deleteOAuthProvider, createOAuthProvider, updateOAuthProvider } from './actions';
import { useTranslations } from 'next-intl';
import { OAuthProvider } from '@/types/oauth';

const { TextArea } = Input;

export default function OAuthProvidersPage() {
  const t = useTranslations('Admin.OAuth');
  const c = useTranslations('Common');
  const [providers, setProviders] = useState<OAuthProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProvider, setEditingProvider] = useState<OAuthProvider | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadProviders();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadProviders = async () => {
    try {
      setLoading(true);
      const data = await getOAuthProviders();
      setProviders(data);
    } catch (error) {
      message.error(t('loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleProvider = async (id: string, enabled: boolean) => {
    try {
      await toggleOAuthProvider(id, enabled);
      message.success(enabled ? t('enableSuccess') : t('disableSuccess'));
      loadProviders();
    } catch (error) {
      message.error(t('operationFailed'));
    }
  };

  const handleDeleteProvider = async (id: string) => {
    try {
      await deleteOAuthProvider(id);
      message.success(t('deleteSuccess'));
      loadProviders();
    } catch (error) {
      message.error(t('operationFailed'));
    }
  };

  const handleCreateOrEdit = () => {
    setModalVisible(true);
    if (editingProvider) {
      form.setFieldsValue({
        ...editingProvider,
        profileMapping: JSON.stringify(editingProvider.profileMapping, null, 2)
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        profileMapping: JSON.stringify({
          id: 'id',
          name: 'name',
          email: 'email',
          image: 'avatar_url'
        }, null, 2),
        buttonColor: '#666666',
        orderIndex: 0,
        enabled: false
      });
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setEditingProvider(null);
    form.resetFields();
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const formData = new FormData();
      
      Object.keys(values).forEach(key => {
        if (values[key] !== undefined && values[key] !== null) {
          if (typeof values[key] === 'object' && key === 'buttonColor') {
            formData.append(key, values[key].toHexString());
          } else {
            formData.append(key, values[key].toString());
          }
        }
      });

      if (editingProvider) {
        await updateOAuthProvider(editingProvider.id, formData);
        message.success(t('updateSuccess'));
      } else {
        await createOAuthProvider(formData);
        message.success(t('createSuccess'));
      }

      handleModalCancel();
      loadProviders();
    } catch (error: any) {
      message.error(error.message || t('operationFailed'));
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
    },
    {
      title: t('displayName'),
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: OAuthProvider) => (
        <div className="flex items-center">
          {record.iconUrl && (
            <img src={record.iconUrl} alt={text} className="w-5 h-5 mr-2" onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }} />
          )}
          <span>{text}</span>
        </div>
      ),
    },
    {
      title: t('authorizationUrl'),
      dataIndex: 'authorizationUrl',
      key: 'authorizationUrl',
      width: 200,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: t('clientId'),
      dataIndex: 'clientId',
      key: 'clientId',
      width: 120,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: t('status'),
      dataIndex: 'enabled',
      key: 'enabled',
      width: 80,
      render: (enabled: boolean, record: OAuthProvider) => (
        <Switch
          checked={enabled}
          onChange={(checked) => handleToggleProvider(record.id, checked)}
          size="small"
        />
      ),
    },
    {
      title: t('orderIndex'),
      dataIndex: 'orderIndex',
      key: 'orderIndex',
      width: 80,
    },
    {
      title: t('created'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: Date) => new Date(date).toLocaleDateString(),
    },
    {
      title: t('actions'),
      key: 'action',
      width: 150,
      render: (_: any, record: OAuthProvider) => (
        <Space size="small">
          <Tooltip title={t('viewDetails')}>
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => {
                Modal.info({
                  title: `${t('providerDetails')} - ${record.name}`,
                  width: 600,
                  content: (
                    <div className="space-y-2">
                      <p><strong>ID:</strong> {record.id}</p>
                      <p><strong>{t('authorizationUrl')}:</strong> {record.authorizationUrl}</p>
                      <p><strong>{t('tokenUrl')}:</strong> {record.tokenUrl}</p>
                      <p><strong>{t('userinfoUrl')}:</strong> {record.userinfoUrl || t('notSet')}</p>
                      <p><strong>{t('scopes')}:</strong> {record.scopes || t('notSet')}</p>
                      <p><strong>{t('fieldMappingLabel')}:</strong></p>
                      <pre className="bg-gray-100 p-2 rounded text-xs">
                        {JSON.stringify(record.profileMapping, null, 2)}
                      </pre>
                      <p><strong>{t('buttonText')}:</strong> {record.buttonText}</p>
                      <p><strong>{t('buttonColorLabel')}:</strong> 
                        <span 
                          className="inline-block w-4 h-4 ml-2 rounded" 
                          style={{ backgroundColor: record.buttonColor }}
                        ></span>
                        {record.buttonColor}
                      </p>
                    </div>
                  ),
                });
              }}
            />
          </Tooltip>
          <Tooltip title={t('edit')}>
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => {
                setEditingProvider(record);
                handleCreateOrEdit();
              }}
            />
          </Tooltip>
          <Tooltip title={t('delete')}>
            <Popconfirm
              title={t('confirmDelete')}
              description={t('confirmDeleteDesc')}
              onConfirm={() => handleDeleteProvider(record.id)}
              okText={c('confirm')}
              cancelText={c('cancel')}
            >
              <Button
                icon={<DeleteOutlined />}
                size="small"
                danger
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">{t('oauthProviders')}</h1>
            <p className="text-gray-600 mt-1">
              {t('oauthProvidersDesc')}
            </p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingProvider(null);
              handleCreateOrEdit();
            }}
          >
            {t('addOAuthProvider')}
          </Button>
        </div>

        <Card className="mb-4">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <BugOutlined className="mr-1" />
              <span>{t('currentProviders')} {providers.length} {t('providers')}</span>
            </div>
            <div className="flex items-center">
              <SettingOutlined className="mr-1" />
              <span>{t('enabledProviders')} {providers.filter(p => p.enabled).length} {t('enabledCount')}</span>
            </div>
          </div>
        </Card>
      </div>

      <Table
        columns={columns}
        dataSource={providers}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => t('totalRecords', { total }),
        }}
      />

      <Modal
        title={editingProvider ? t('editOAuthProvider') : t('addOAuthProvider')}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={800}
        okText={c('confirm')}
        cancelText={c('cancel')}
      >
        <Form form={form} layout="vertical">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label={t('providerId')}
              name="id"
              rules={[{ required: true, message: t('requiredFields') }]}
            >
              <Input placeholder={t('providerIdPlaceholder')} disabled={!!editingProvider} />
            </Form.Item>
            <Form.Item
              label={t('displayName')}
              name="name"
              rules={[{ required: true, message: t('requiredFields') }]}
            >
              <Input placeholder={t('displayNamePlaceholder')} />
            </Form.Item>
          </div>

          <Form.Item
            label={t('authorizationUrl')}
            name="authorizationUrl"
            rules={[{ required: true, message: t('requiredFields') }]}
          >
            <Input placeholder={t('authorizationUrlPlaceholder')} />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label={t('tokenUrl')}
              name="tokenUrl"
              rules={[{ required: true, message: t('requiredFields') }]}
            >
              <Input placeholder={t('tokenUrlPlaceholder')} />
            </Form.Item>
            <Form.Item
              label={t('userinfoUrl')}
              name="userinfoUrl"
            >
              <Input placeholder={t('userinfoUrlPlaceholder')} />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label={t('clientId')}
              name="clientId"
              rules={[{ required: true, message: t('requiredFields') }]}
            >
              <Input placeholder={t('clientIdPlaceholder')} />
            </Form.Item>
            <Form.Item
              label={t('clientSecret')}
              name="clientSecret"
              rules={[{ required: true, message: t('requiredFields') }]}
            >
              <Input.Password placeholder={t('clientSecretPlaceholder')} />
            </Form.Item>
          </div>

          <Form.Item
            label={t('scopes')}
            name="scopes"
          >
            <Input placeholder={t('scopesPlaceholder')} />
          </Form.Item>

          <Form.Item
            label={t('profileMapping')}
            name="profileMapping"
            rules={[
              { required: true, message: t('mappingRequired') },
              {
                validator: (_, value) => {
                  try {
                    const parsed = JSON.parse(value);
                    if (!parsed.id) {
                      return Promise.reject(new Error(t('mappingRequiredId')));
                    }
                    return Promise.resolve();
                  } catch {
                    return Promise.reject(new Error(t('invalidJson')));
                  }
                }
              }
            ]}
          >
            <TextArea 
              rows={4} 
              placeholder={t('profileMappingPlaceholder')}
            />
          </Form.Item>

          <div className="grid grid-cols-3 gap-4">
            <Form.Item
              label={t('buttonText')}
              name="buttonText"
            >
              <Input placeholder={t('buttonTextPlaceholder')} />
            </Form.Item>
            <Form.Item
              label={t('buttonColor')}
              name="buttonColor"
            >
              <ColorPicker showText />
            </Form.Item>
            <Form.Item
              label={t('orderIndex')}
              name="orderIndex"
            >
              <InputNumber min={0} placeholder={0} />
            </Form.Item>
          </div>

          <Form.Item
            label={t('iconUrl')}
            name="iconUrl"
          >
            <Input placeholder={t('iconUrlPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}