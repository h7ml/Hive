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
  const t = useTranslations('Admin.Models');
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
      title='设置 GitHub 登录'
      maskClosable={false}
      keyboard={false}
      centered={true}
      okText={t('okText')}
      cancelText={t('cancelText')}
      open={isModalOpen}
      onCancel={() => setIsModalOpen(false)}
      footer={<Button onClick={() => setIsModalOpen(false)}>关闭</Button>}
    >
      <div className='mt-4'>
        <Form
          layout="vertical"
          form={settingForm}
        >
          <div className='mt-2 mb-6 bg-slate-100 p-4 rounded-md'>
            <span className='font-medium text-base'>当前状态</span>
            {isActive ?
              <div className='flex flex-row items-center my-4'>
                <div className='w-3 h-3 bg-green-500 rounded-full'></div>
                <span className='ml-2 text-sm'>已启用</span>
              </div> :
              <div className='flex flex-row items-center my-4'>
                <div className='w-3 h-3 bg-gray-400 rounded-full'></div>
                <span className='ml-2 text-sm'>未启用</span>
              </div>
            }
            <div className='text-gray-500'>
              如需启用或禁用 GitHub 登录，请修改根目录 .env 文件，并重新编译并启动程序。
              <br />
              配置步骤：
              <ol className='list-decimal list-inside mt-2 text-sm'>
                <li>前往 GitHub Settings → Developer settings → OAuth Apps</li>
                <li>创建新的 OAuth App，设置回调 URL 为：<code className='bg-gray-200 px-1 rounded'>{`{域名}/api/auth/callback/github`}</code></li>
                <li>获取 Client ID 和 Client Secret 配置到环境变量</li>
                <li>重启应用生效</li>
              </ol>
            </div>
          </div>
          <Form.Item
            name='clientId'
            label={<span className='font-medium'>Client ID</span>}
            rules={[{ required: true, message: '当前项为必填' }]}
          >
            <Input disabled />
          </Form.Item>
          <Form.Item
            name='clientSecret'
            label={<span className='font-medium'>Client Secret</span>}
            rules={[{ required: true, message: '当前项为必填' }]}
          >
            <Input type='password' disabled />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

export default GitHubSettingsModal;