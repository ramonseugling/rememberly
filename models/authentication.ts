import { UnauthorizedError } from 'infra/errors';
import password from 'models/password';
import user from 'models/user';

async function getAuthenticatedUser(
  providedEmail: string,
  providedPassword: string,
) {
  try {
    const storedUser = await findUserByEmail(providedEmail);
    await validatePassword(providedPassword, storedUser.password);

    return storedUser;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw new UnauthorizedError({
        message: 'Dados de autenticação não conferem.',
        action: 'Verifique se os dados enviados estão corretos.',
      });
    }

    throw error;
  }

  async function findUserByEmail(email: string) {
    const storedUser = await user.findOneByEmail(email);

    if (!storedUser) {
      throw new UnauthorizedError({
        message: 'E-mail não confere.',
        action: 'Verifique se este dado está correto.',
      });
    }

    return storedUser;
  }

  async function validatePassword(provided: string, stored: string) {
    const match = await password.compare(provided, stored);

    if (!match) {
      throw new UnauthorizedError({
        message: 'Senha não confere.',
        action: 'Verifique se este dado está correto.',
      });
    }
  }
}

const authentication = { getAuthenticatedUser };

export default authentication;
