import { CallApiContext, type CallApiParams, type ClientType } from "./CallApiContext";

import { v4 as uuidv4 } from 'uuid';
import { createClient } from "../../utils/configCallApi/create-client";

export interface Props {
  children: React.ReactNode;
}

const API_PUBLIC_URL = import.meta.env.VITE_API_PUBLIC_URL ?? "http://localhost/api/";
const API_PRIVATE_URL = import.meta.env.VITE_API_PRIVATE_URL ?? "http://localhost/_api/";

const clientPlatformPublic = createClient({
  type: "Initium-public",
  config: {
    baseDomain: API_PUBLIC_URL,
    headers: {
      "channel-id": '',
      "channel-name": '',
      "span-id": '',
      "transaction-id": ''
    },
    withCredentials: true
  }
});
const clientPlatformPrivate = createClient({
  type: "Initium-private",
  config: {
    baseDomain: API_PRIVATE_URL,
    headers: {
      "channel-id": '',
      "channel-name": '',
      "span-id": '',
      "transaction-id": ''
    },
    withCredentials: true
  }
});
const clientDefault = createClient({
  type: "Others",
  config: {
    baseDomain: '',
    headers: {},
  },
});

const clientMap: Record<ClientType, ReturnType<typeof createClient>> = {
  "InitiumSaaS-Public": clientPlatformPublic,
  "InitiumSaaS-Private": clientPlatformPrivate,
  "other": clientDefault,
};

function getClient(clientType: ClientType) {
  return clientMap[clientType];
}

const buildHeaders = (headers?: Record<string, string>, headersSeccions?: Record<string, string>): Record<string, string> => ({
  ...(headersSeccions ?? {}),
  ...(headers ?? {}),
});

export const CallApiContextProvider = ({ children }: Props) => {


  const getDynamicHeaders = (clientType: ClientType, token: string): Record<string, string> => {
    switch (clientType) {
      case "InitiumSaaS-Private":
        return {
          'channel-id': uuidv4(),
          'channel-name': 'home',
          'span-id': uuidv4(),
          'transaction-id': uuidv4()
        };
      case "InitiumSaaS-Public":
        return {
          'channel-id': uuidv4(),
          'channel-name': "11",
          'span-id': uuidv4(),
          'transaction-id': uuidv4(),
          ...(token && {
            Authorization: `Bearer ${token}`,
          }),
        };
      case "other":
      default:
        return {};
    }
  };

  const useFetch = <T = unknown>({ path, method, body, headers, clientType, skipEncrypt, token }: CallApiParams) => {
    const client = getClient(clientType);
    const hea = getDynamicHeaders(clientType, token);
    const headerFull = buildHeaders(headers, hea);
    return client.useFetch<T>(path, { method, body, headers: headerFull, skipEncrypt });
  };

  const fetcher = <T = unknown>({ path, method, body, headers, clientType, skipEncrypt, token }: CallApiParams) => {
    const client = getClient(clientType);
    const hea = getDynamicHeaders(clientType, token);
    const headerFull = buildHeaders(headers, hea);
    return client.fetcher<T>(path, { method, body, headers: headerFull, skipEncrypt });
  };

  return (
    <CallApiContext.Provider value={{ useFetch, fetcher }}>
      {children}
    </CallApiContext.Provider>
  );
};
