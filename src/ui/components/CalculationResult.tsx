import { FC, useMemo } from "react";
import { observer } from "mobx-react-lite";
import {
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useBalancer, usePortfolioStore } from "../container/container.ts";
import { formatNumberToCurrency, formatNumberToPercentage } from "../utils.ts";

const CalculationResult: FC = observer(() => {
  const portfolioStore = usePortfolioStore();
  const balancer = useBalancer();

  const maps = useMemo(() => {
    const targetSum = portfolioStore.targetSum;

    const currentPortfolio = {
      balance: portfolioStore.balance,
      positions: portfolioStore.positions,
    };
    const newPortfolio = balancer.calculate(currentPortfolio);

    const balanceMap = {
      oldValue: portfolioStore.balance,
      newValue: newPortfolio.balance,
      diff: newPortfolio.balance - portfolioStore.balance,
    };

    const totalValue = newPortfolio.positions.reduce(
      (previousValue, position) =>
        previousValue + position.quantity * position.price,
      0,
    );

    const positionsMap = newPortfolio.positions.map((position) => {
      const oldPosition = portfolioStore.positions.find(
        (p) => p.ticker === position.ticker,
      )!;

      const oldPercentage =
        ((oldPosition.quantity * oldPosition.price) /
          portfolioStore.totalValue) *
        100;
      const newPercentage =
        ((position.quantity * position.price) / totalValue) * 100;

      const oldTotalValue = oldPosition.quantity * oldPosition.price;
      const newTotalValue = position.quantity * position.price;

      return {
        ticker: position.ticker,
        quantity: position.quantity,
        price: position.price,
        target: position.target,
        oldQuantity: oldPosition.quantity,
        diffQuantity: position.quantity - oldPosition.quantity,
        oldPrice: oldPosition.price,
        oldPercentage: oldPercentage,
        newPercentage: newPercentage,
        diffPercentage: newPercentage - oldPercentage,
        oldTotal: oldTotalValue,
        newTotal: newTotalValue,
        diffTotal: newTotalValue - oldTotalValue,
      };
    });

    return {
      targetSum,
      balanceMap,
      positionsMap,
    };
  }, [
    balancer,
    portfolioStore.balance,
    portfolioStore.positions,
    portfolioStore.totalValue,
    portfolioStore.targetSum,
  ]);

  const getCorrectSuffix = (
    diff: number,
    type: "money" | "percentage" | null = null,
  ) => {
    if (diff == 0) {
      return null;
    }

    let finalValue;

    if (type === "money") {
      finalValue = formatNumberToCurrency(diff);
    } else if (type === "percentage") {
      finalValue = formatNumberToPercentage(diff);
    } else {
      finalValue = diff.toString();
    }

    if (diff > 0) {
      return <span style={{ color: "green" }}>+{finalValue}</span>;
    } else if (diff < 0) {
      return <span style={{ color: "red" }}>{finalValue}</span>;
    }
    return finalValue;
  };

  const applyChanges = () => {
    const newPortfolio = {
      balance: maps.balanceMap.newValue,
      positions: maps.positionsMap.map((m) => ({
        ticker: m.ticker,
        quantity: m.quantity,
        price: m.price,
        target: m.target,
      })),
    };
    portfolioStore.loadPortfolio(newPortfolio);
  };

  if (maps.targetSum !== 100) {
    return (
      <Typography variant="h6" sx={{ mt: 2, textAlign: "center" }}>
        The sum of the targets must be 100%
      </Typography>
    );
  }

  return (
    <Stack sx={{ mt: 2 }} spacing={1}>
      <Typography variant="h6" sx={{ mr: 1 }}>
        Result Balance: {formatNumberToCurrency(maps.balanceMap.newValue)}{" "}
        {getCorrectSuffix(maps.balanceMap.diff, "money")}
      </Typography>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell align="left">
                <Typography>Ticker</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography>Quantity</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography>Total</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography>Result %</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {maps.positionsMap.length === 0 ? (
              <TableRow
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell colSpan={6} sx={{ padding: 2, textAlign: "center" }}>
                  <Typography>No positions</Typography>
                </TableCell>
              </TableRow>
            ) : (
              maps.positionsMap.map((position) => (
                <TableRow
                  key={position.ticker}
                  sx={{
                    "&:last-child td, &:last-child th": { border: 0 },
                  }}
                >
                  <TableCell align="left" component="th" scope="row">
                    <Typography sx={{ fontWeight: "bold" }}>
                      {position.ticker}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography>
                      {position.quantity}{" "}
                      {getCorrectSuffix(position.diffQuantity)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography>
                      {formatNumberToCurrency(position.newTotal)}{" "}
                      {getCorrectSuffix(position.diffTotal, "money")}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography>
                      {formatNumberToPercentage(position.newPercentage)}{" "}
                      {getCorrectSuffix(position.diffPercentage, "percentage")}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Button variant="text" onClick={applyChanges}>
        Apply
      </Button>
    </Stack>
  );
});

export default CalculationResult;
