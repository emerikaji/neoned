import * as rootParams from 'next/root-params';
import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';
import {hasLocale} from 'next-intl';
import {routing} from './routing';

export default getRequestConfig(async ({locale}) => {
  if (!locale) {
    const paramValue = await rootParams.locale();
    if (hasLocale(routing.locales, paramValue)) {
      locale = paramValue;
    } else {
      notFound();
    }
  }

  let messages;
  switch (locale) {
    case 'en':
      messages = (await import('../messages/en.json')).default;
      break;
    case 'fr':
    default:
      messages = (await import('../messages/fr.json')).default;
      break;
  }

  return {
    locale,
    messages
  };
});