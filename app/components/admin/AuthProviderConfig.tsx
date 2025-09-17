'use client';
import { useState, useEffect } from 'react'
import { Button } from "antd";
import { getActiveAuthProvides } from '@/app/(auth)/actions';
import { useTranslations } from 'next-intl';
import EmailLogo from '@/app/images/loginProvider/email.svg'
import FeishuLogo from '@/app/images/loginProvider/feishu.svg'
import WecomLogo from '@/app/images/loginProvider/wecom.svg'
import DingdingLogo from '@/app/images/loginProvider/dingding.svg'
import GitHubLogo from '@/app/images/loginProvider/github.svg'
import EmailSettingsModal from '@/app/components/admin/EmailSettingsModal'
import FeishuSettingsModal from '@/app/components/admin/FeishuSettingsModal'
import DingdingSettingsModal from '@/app/components/admin/DingdingSettingsModal'
import WecomSettingsModal from '@/app/components/admin/WecomSettingsModal'
import GitHubSettingsModal from '@/app/components/admin/GitHubSettingsModal'

const AuthProviderConfig = () => {
  const t = useTranslations('Admin.System');
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isFeishuModalOpen, setIsFeishuModalOpen] = useState(false);
  const [isWecomModalOpen, setIsWecomModalOpen] = useState(false);
  const [isDingdingModalOpen, setIsDingdingModalOpen] = useState(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [authProviders, setAuthProviders] = useState<string[]>([]);

  useEffect(() => {
    const fetchSettings = async () => {
      const activeAuthProvides = await getActiveAuthProvides();
      setAuthProviders(activeAuthProvides);
    }
    fetchSettings();
  }, []);
  return (
    <div className='flex flex-col mt-6 p-2 rounded-md bg-gray-100'>
      <h3 className='ml-2 my-2'>{t('loginSettings')}</h3>
      <div className='flex flex-row items-center m-2 p-4 justify-between bg-white rounded-lg'>
        <div className='flex flex-row items-center'>
          <EmailLogo className='border border-gray-200 p-2 w-10 h-10 rounded-lg' />
          <span className='ml-2'>{t('emailLogin')}</span>
        </div>
        <div className='flex flex-row items-center'>
          {authProviders.includes('email') ? <>
            <div className='w-2 h-2 bg-green-500 rounded m-2'></div>
            <span className='mr-4 text-sm'>{t('enabled')}</span>
          </> :
            <>
              <div className='w-2 h-2 bg-gray-400 rounded m-2'></div>
              <span className='mr-4 text-sm'>{t('disabled')}</span>
            </>
          }
          <Button
            onClick={() => {
              setIsEmailModalOpen(true);
            }}
          >{t('setting')}</Button>
        </div>
      </div>

      <div className='flex flex-row items-center m-2 p-4 justify-between bg-white rounded-lg'>
        <div className='flex flex-row items-center'>
          <FeishuLogo className='border border-gray-200 p-2 w-10 h-10 rounded-lg' />
          <span className='ml-2'>{t('feishuLogin')}</span>
        </div>
        <div className='flex flex-row items-center'>
          {authProviders.includes('feishu') ? <>
            <div className='w-2 h-2 bg-green-500 rounded m-2'></div>
            <span className='mr-4 text-sm'>{t('enabled')}</span>
          </> :
            <>
              <div className='w-2 h-2 bg-gray-400 rounded m-2'></div>
              <span className='mr-4 text-sm'>{t('disabled')}</span>
            </>
          }
          <Button
            onClick={() => {
              setIsFeishuModalOpen(true);
            }}
          >{t('details')}</Button>
        </div>
      </div>

      <div className='flex flex-row items-center m-2 p-4 justify-between bg-white rounded-lg'>
        <div className='flex flex-row items-center'>
          <WecomLogo className='border border-gray-200 p-2 w-10 h-10 rounded-lg' />
          <span className='ml-2'>{t('wecomLogin')}</span>
        </div>
        <div className='flex flex-row items-center'>
          {authProviders.includes('wecom') ? <>
            <div className='w-2 h-2 bg-green-500 rounded m-2'></div>
            <span className='mr-4 text-sm'>{t('enabled')}</span>
          </> :
            <>
              <div className='w-2 h-2 bg-gray-400 rounded m-2'></div>
              <span className='mr-4 text-sm'>{t('disabled')}</span>
            </>
          }
          <Button
            onClick={() => {
              setIsWecomModalOpen(true);
            }}
          >{t('details')}</Button>
        </div>
      </div>

      <div className='flex flex-row items-center m-2 p-4 justify-between bg-white rounded-lg'>
        <div className='flex flex-row items-center'>
          <DingdingLogo className='border border-gray-200 p-2 w-10 h-10 rounded-lg' />
          <span className='ml-2'>{t('dingdingLogin')}</span>
        </div>
        <div className='flex flex-row items-center'>
          {authProviders.includes('dingding') ? <>
            <div className='w-2 h-2 bg-green-500 rounded m-2'></div>
            <span className='mr-4 text-sm'>{t('enabled')}</span>
          </> :
            <>
              <div className='w-2 h-2 bg-gray-400 rounded m-2'></div>
              <span className='mr-4 text-sm'>{t('disabled')}</span>
            </>
          }
          <Button
            onClick={() => {
              setIsDingdingModalOpen(true);
            }}
          >{t('details')}</Button>
        </div>
      </div>

      <div className='flex flex-row items-center m-2 p-4 justify-between bg-white rounded-lg'>
        <div className='flex flex-row items-center'>
          <GitHubLogo className='border border-gray-200 p-2 w-10 h-10 rounded-lg' />
          <span className='ml-2'>{t('githubLogin')}</span>
        </div>
        <div className='flex flex-row items-center'>
          {authProviders.includes('github') ? <>
            <div className='w-2 h-2 bg-green-500 rounded m-2'></div>
            <span className='mr-4 text-sm'>{t('enabled')}</span>
          </> :
            <>
              <div className='w-2 h-2 bg-gray-400 rounded m-2'></div>
              <span className='mr-4 text-sm'>{t('disabled')}</span>
            </>
          }
          <Button
            onClick={() => {
              setIsGitHubModalOpen(true);
            }}
          >{t('details')}</Button>
        </div>
      </div>

      <EmailSettingsModal
        isModalOpen={isEmailModalOpen}
        setIsModalOpen={setIsEmailModalOpen}
      />

      <WecomSettingsModal
        isModalOpen={isWecomModalOpen}
        setIsModalOpen={setIsWecomModalOpen}
      />
      <FeishuSettingsModal
        isModalOpen={isFeishuModalOpen}
        setIsModalOpen={setIsFeishuModalOpen}
      />
      <DingdingSettingsModal
        isModalOpen={isDingdingModalOpen}
        setIsModalOpen={setIsDingdingModalOpen}
      />
      <GitHubSettingsModal
        isModalOpen={isGitHubModalOpen}
        setIsModalOpen={setIsGitHubModalOpen}
      />
    </div>
  )
}

export default AuthProviderConfig