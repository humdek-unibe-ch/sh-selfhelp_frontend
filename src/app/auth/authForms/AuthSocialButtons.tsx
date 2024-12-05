import CustomSocialButton from "@/app/components/forms/theme-elements/CustomSocialButton";
import { signInType } from "@/types/auth/auth";
import { Avatar, Box, Group } from "@mantine/core";
import { useMediaQuery } from '@mantine/hooks';

const AuthSocialButtons = ({ title }: signInType) => {
  const isMobile = useMediaQuery('(max-width: 48em)');
  
  return (
    <Group justify="center" gap="sm" mt="lg">
      <CustomSocialButton>
        <Avatar
          src={"/images/svgs/google-icon.svg"}
          alt={"icon1"}
          style={{
            width: 16,
            height: 16,
            borderRadius: 0,
            marginRight: '0.25rem',
          }}
        />
        {!isMobile && (
          <Box style={{ whiteSpace: "nowrap", marginRight: '0.25rem' }}>
            {title}
          </Box>
        )}
        Google
      </CustomSocialButton>
      <CustomSocialButton>
        <Avatar
          src={"/images/svgs/facebook-icon.svg"}
          alt={"icon2"}
          style={{
            width: 25,
            height: 25,
            borderRadius: 0,
            marginRight: '0.25rem',
          }}
        />
        {!isMobile && (
          <Box style={{ whiteSpace: "nowrap", marginRight: '0.25rem' }}>
            {title}
          </Box>
        )}
        FB
      </CustomSocialButton>
    </Group>
  );
}

export default AuthSocialButtons;
