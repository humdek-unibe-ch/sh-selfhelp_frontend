import { Box } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import { CSSProperties } from "react";

interface PropsType {
  children: React.ReactElement | React.ReactNode;
  style?: CSSProperties;
}

const Scrollbar = (props: PropsType) => {
  const { children, style, ...other } = props;
  const lgDown = useMediaQuery('(max-width: 1200px)');

  if (lgDown) {
    return (
      <Box style={{ overflowX: "auto", ...style }}>
        {children}
      </Box>
    );
  }

  return (
    <SimpleBar style={{ maxHeight: "100%", ...style }} {...other}>
      {children}
    </SimpleBar>
  );
};

export default Scrollbar;
