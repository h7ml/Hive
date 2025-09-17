import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Button } from 'antd';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { getGitHubAuthInfo } from '@/app/(auth)/actions';

type settingsModalProps = {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
};

interface FormValues {
  clientId: string;
  clientSecret: string;
}

const GitHubSettingsModal: React.FC<settingsModalProps> = ({
  isModalOpen,
  setIsModalOpen,
}) => {
  const t = useTranslations('Admin.System');
  const tCommon = useTranslations('Admin.Models');
  const [isActive, setIsActive] = useState(false);
  const [settingForm] = Form.useForm<FormValues>();

  useEffect(() => {
    if (isModalOpen) {
      const fetchSettings = async () => {
        const activeAuthProvides = await getGitHubAuthInfo();
        setIsActive(activeAuthProvides.isActive);
        settingForm.setFieldsValue({
          clientId: activeAuthProvides.clientId,
          clientSecret: activeAuthProvides.clientSecret,
        })
      }
      fetchSettings();
    }
  }, [isModalOpen, settingForm]);

  return (
    <Modal
      title={t('setupGitHubLogin')}
      maskClosable={false}
      keyboard={false}
      centered={true}
      okText={tCommon('okText')}
      cancelText={tCommon('cancelText')}
      open={isModalOpen}
      onCancel={() => setIsModalOpen(false)}
      footer={<Button onClick={() => setIsModalOpen(false)}>{t('close')}</Button>}
    >
      <div className='mt-4'>
        <Form
          layout="vertical"
          form={settingForm}
        >
          <div className='mt-2 mb-6 bg-slate-100 p-4 rounded-md'>
            <span className='font-medium text-base'>{t('authStatus')}</span>
            {isActive ?
              <div className='flex flex-row items-center my-4'>
                <div className='w-3 h-3 bg-green-500 rounded-full'></div>
                <span className='ml-2 text-sm'>{t('enabled')}</span>
              </div> :
              <div className='flex flex-row items-center my-4'>
                <div className='w-3 h-3 bg-gray-400 rounded-full'></div>
                <span className='ml-2 text-sm'>{t('disabled')}</span>
              </div>
            }
            <div className='text-gray-500'>
              {t('githubConfigGuide')}
              <br />
              {t('githubConfigSteps')}
              <ol className='list-decimal list-inside mt-2 text-sm'>
                <li>{t('githubStep1')}</li>
                <li>{t('githubStep2')}<code className='bg-gray-200 px-1 rounded'>{`{域名}/api/auth/callback/github`}</code></li>
                <li>{t('githubStep3')}</li>
                <li>{t('githubStep4')}</li>
              </ol>
            </div>
          </div>
          <Form.Item
            name='clientId'
            label={<span className='font-medium'>{t('clientId')}</span>}
            rules={[{ required: true, message: tCommon('fieldRequired') }]}
          >
            <Input disabled />
          </Form.Item>
          <Form.Item
            name='clientSecret'
            label={<span className='font-medium'>{t('clientSecret')}</span>}
            rules={[{ required: true, message: tCommon('fieldRequired') }]}
          >
            <Input type='password' disabled />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

export default GitHubSettingsModal;