import { authenticate, isCallbackUrlValid } from '../../../src/serverless/nus-auth';
import {
  createRouteHandler,
  defaultFallback,
  Handler,
  MethodHandlers,
} from '../../../src/serverless/handler';

const errors = {
  noRelayState: 'ERR_NO_RELAY_STATE',
  invalidRelayState: 'ERR_INVALID_RELAY_STATE',
};

const handlePost: Handler = async (req, res) => {
  try {
    const { token, relayState } = await authenticate(req);
    if (!relayState) {
      throw new Error(errors.noRelayState);
    }

    if (!isCallbackUrlValid(relayState)) {
      throw new Error(errors.invalidRelayState);
    }
    const userURL = new URL(relayState);
    userURL.searchParams.append('token', token);

    res.redirect(301, userURL.toString());
  } catch (err) {
    if (err.message === errors.noRelayState) {
      res.json({
        message: 'Relay state not found in request',
      });
    } else if (err.message === errors.invalidRelayState) {
      res.json({
        message: 'Invalid relay state given. URL must be from a valid domain.',
      });
    } else {
      throw err;
    }
  }
};

// eslint-disable-next-line no-unused-vars
const handleError: (error: Error) => Handler = (error) => async (_req, res) => {
  // eslint-disable-next-line no-console
  console.error(error);
  res.status(500).json({
    message:
      'An unexpected error occurred. Please try logging in with your NUSID, in the format nusstu\\e0123456, instead of your email. You can use Incognito mode or clear your cookies to try again.',
    error,
  });
};

const methodHandlers: MethodHandlers = {
  POST: handlePost,
};

export default createRouteHandler(methodHandlers, defaultFallback, handleError);
